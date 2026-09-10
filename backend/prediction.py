from datetime import datetime, timedelta, date
from database import fetch_query, execute_query
####################################
#CHECK LOGIC

######################
# Life stages where periods aren't expected, so prediction is switched off.

PAUSED_PROFILES = {"Prepubescent", "Postmenopause"}

AVERAGE_LUTEAL_LENGTH = 14

OVULATION_SYMPTOMS = {"increased_discharge", "increased_libido"}
PREMENSTRUAL_SYMPTOMS = {"cramps", "bloating", "breast_soreness", "badskin", "badmood", "lowenergy", "diarrhea"}

def clamp_cycle_length(length):
    # Safety net so a weighted average can never violate the Cycle table's
    # own CHECK constraint, however the numbers feeding into it behave.
    return max(15, min(60, round(length)))

def get_user_profile(user_id):
    user = fetch_query("SELECT * FROM User WHERE UserID = ?", (user_id,))
    if not user:
        return None
    return user[0]["LifeStage"]


def get_recent_cycles(user_id, limit=6):
    #Returns the user's most recent cycles, oldest first
    rows = fetch_query(
        "SELECT StartDate, PeriodLength FROM Cycle WHERE UserID = ? "
        "ORDER BY StartDate DESC LIMIT ?",
        (user_id, limit),
    )
    cycles = [
        {
            "start": datetime.strptime(r["StartDate"], "%Y-%m-%d").date(),
            "period_length": r["PeriodLength"],
        }
        for r in rows
    ]
    cycles.sort(key=lambda c: c["start"])  # oldest -> newest
    return cycles



MAX_PLAUSIBLE_GAP = 90
MIN_PLAUSIBLE_GAP = 15  # matches the Cycle table's own CHECK (CycleLength BETWEEN 15 AND 60)

def calculate_gaps(cycles):
    #Days between each consecutive period start. Oldest gap first.
    all_gaps = [
        (cycles[i + 1]["start"] - cycles[i]["start"]).days
        for i in range(len(cycles) - 1)
    ]
    return [g for g in all_gaps if MIN_PLAUSIBLE_GAP <= g <= MAX_PLAUSIBLE_GAP]

def remove_skipped_cycle_outliers(gaps):
    if len(gaps) < 3:
        return gaps

    sorted_gaps = sorted(gaps)
    median = sorted_gaps[len(sorted_gaps) // 2]
    filtered = []
    for gap in gaps:
        if gap > median * 1.75:
            continue
        filtered.append(gap)

    return filtered


def is_irregular(cycles, gaps):
    if len(cycles) < 3:
        return True
    recent_gaps = gaps[-3:] if len(gaps) >= 3 else gaps
    for i in range(len(recent_gaps) - 1):
        if abs(recent_gaps[i] - recent_gaps[i + 1]) > 6:
            return True
    return False


def get_recent_symptoms(user_id, days=4):
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    rows = fetch_query(
        "SELECT DISTINCT Symptom FROM Symptom WHERE UserID = ? AND Date >= ?",
        (user_id, cutoff),
    )
    return {r["Symptom"] for r in rows}

    

def symptom_adjustment(symptoms, luteal_length, user_id, ovulationhappened, last_ovulation_date):
    #Ovulation-indicating symptoms suggest the luteal phase is beginning,
    #so use the luteal length. General PMS symptoms suggest the
    #period is close, so nudge the prediction closer by a couple of days.
    cycles = get_recent_cycles(user_id, limit=6)
    last_period_start = cycles[-1]["start"]
    last_period_length = cycles[-1]["period_length"]
    last_period_end = last_period_start + timedelta(days=last_period_length - 1)


    
    
        
    if symptoms & PREMENSTRUAL_SYMPTOMS and (date.today() - last_period_end).days >= 7:
        if len(symptoms & PREMENSTRUAL_SYMPTOMS) > 4:
            return 1
        else:
            return 4
    else:
        if ovulationhappened== True:
            #makes the luteal gap day by day accurate
            luteal_length = luteal_length - (date.today() - last_ovulation_date).days
            return luteal_length
        else:
            return 0

def get_average_luteal_length(user_id, fallback=AVERAGE_LUTEAL_LENGTH):
    # works out the luteal length from the user's own history instead of
    # just using the static average - for each past cycle, find the last
    # day an ovulation symptom was logged before the next period started,
    # and use the gap. averages these across however many cycles have that
    # data. falls back to AVERAGE_LUTEAL_LENGTH if there's not enough yet
    ##########################
    ##ARE WE SURE THIS IS FINDING THE RIGHT OV DATE
    cycles = get_recent_cycles(user_id, limit=6)
    if len(cycles) < 2:
        return fallback, False, None

    placeholders = ",".join("?" for _ in OVULATION_SYMPTOMS)
    observed_lengths = []
    last_ovulation_date = None
    for i in range(len(cycles) - 1):
        window_start = cycles[i]["start"].isoformat()
        window_end = cycles[i + 1]["start"].isoformat()
        rows = fetch_query(
            f"SELECT DISTINCT Date FROM Symptom WHERE UserID = ? "
            f"AND Symptom IN ({placeholders}) AND Date > ? AND Date < ? "
            f"ORDER BY Date",
            (user_id, *OVULATION_SYMPTOMS, window_start, window_end),
        )
        if rows:
            last_ovulation_date = datetime.strptime(rows[-1]["Date"], "%Y-%m-%d").date()
            observed = (cycles[i + 1]["start"] - last_ovulation_date).days
            if 5 <= observed <= 20:  # sanity bound, luteal phase doesn't vary wildly
                observed_lengths.append(observed)
    ##this is supposed to check if this cycles ovulation has happened
    if last_ovulation_date is not None and last_ovulation_date < date.today() and last_ovulation_date > cycles[-1]["start"]:
        ovulationhappened = True
    else:
        ovulationhappened = False
        
    if not observed_lengths:
        return fallback, False, None
    return round(sum(observed_lengths) / len(observed_lengths)), ovulationhappened, last_ovulation_date
    
def get_fertility_window(user_id):
    profile = get_user_profile(user_id)
    if profile != "Fertility":
        return None
    predicted = predict_next_period(user_id)
    if predicted is None:
        return None
    luteal_length, _, _ = get_average_luteal_length(user_id)
    predicted_date = datetime.strptime(predicted, "%Y-%m-%d").date()
    ovulation_date = predicted_date - timedelta(days=luteal_length)
    start = ovulation_date - timedelta(days=5)
    end = ovulation_date + timedelta(days=1)  # 5 days before + ovulation day + 1 day after = 7 days
    return {"start": start.isoformat(), "end": end.isoformat(), "ovulation": ovulation_date.isoformat()}

def predict_period_length(user_id):
    #Estimates how many days the current/next period will last, based on
    #the average of past recorded period lengths. Extended by 1 day if
    #heavy bleeding was logged specifically on the previous day.
    cycles = get_recent_cycles(user_id, limit=6)
    if not cycles:
        return None

    average_length = sum(c["period_length"] for c in cycles) / len(cycles)

    yesterday = (date.today() - timedelta(days=1)).isoformat()
    yesterday_symptoms = fetch_query(
        "SELECT Symptom FROM Symptom WHERE UserID = ? AND Date = ?",
        (user_id, yesterday),
    )
    symptom_names = {row["Symptom"] for row in yesterday_symptoms}

    if "bleedingheavy" in symptom_names:
        average_length += 1

    return round(average_length)


def predict_next_period(user_id):
    user = fetch_query("SELECT LifeStage, ContinuousHRT FROM User WHERE UserID = ?", (user_id,))
    if not user:
        return None
    profile = user[0]["LifeStage"]
    continuous_hrt = bool(user[0]["ContinuousHRT"])
    if profile in PAUSED_PROFILES or continuous_hrt:
        return None

    cycles = get_recent_cycles(user_id, limit=6)
    gaps = calculate_gaps(cycles)
    gaps = remove_skipped_cycle_outliers(gaps)
    if not gaps:
        return None

    irregular = is_irregular(cycles, gaps)
    symptoms = get_recent_symptoms(user_id)
    luteal_length, ovulationhappened, last_ovulation_date = get_average_luteal_length(user_id)
    adjustment = symptom_adjustment(symptoms, luteal_length, user_id, ovulationhappened, last_ovulation_date)

    recent_gaps = list(reversed(gaps))
    effective_adjustment = adjustment if adjustment else sum(recent_gaps) / len(recent_gaps)

    def gap_at(i):
        return recent_gaps[i] if i < len(recent_gaps) else effective_adjustment

    if not irregular:
        gap_weights = [0.35, 0.25, 0.15, 0.08, 0.02]
        adjustment_weight = 0.15
    else:
        gap_weights = [0.25, 0.20, 0.15]
        adjustment_weight = 0.40

    last_period_start = cycles[-1]["start"]
    weighted_cycle = sum(gap_at(i) * w for i, w in enumerate(gap_weights))

    days_until_period = weighted_cycle - (date.today() - last_period_start).days
    days_until_period += effective_adjustment * adjustment_weight

    predicted_start = date.today() + timedelta(days=round(days_until_period))
    average_cycle_length = round(weighted_cycle)
    days_since_last_period = (date.today() - last_period_start).days

    if days_since_last_period >= average_cycle_length:
        # A full average cycle has passed with nothing logged since - genuinely
        # missed, not just late. Roll forward a full cycle at a time.
        while predicted_start < date.today():
            predicted_start += timedelta(days=average_cycle_length)
    else:
        # Still within one average cycle length - it's late, not missed.
        # Pin to today, which naturally pushes back a day at a time as
        # each day passes with nothing new logged.
        if predicted_start < date.today():
            predicted_start = date.today()

    last_cycle_id = fetch_query(
        "SELECT CycleID FROM Cycle WHERE UserID = ? ORDER BY StartDate DESC LIMIT 1",
        (user_id,),
    )[0]["CycleID"]
    execute_query(
        "UPDATE Cycle SET CycleLength = ? WHERE CycleID = ?",
        (clamp_cycle_length(weighted_cycle), last_cycle_id),
    )

    return predicted_start.isoformat()