"""Lifelong Health Companion - Backend API tests."""
import os
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://growth-health-app.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

PARENT = {"email": "parent@demo.com", "password": "demo1234"}
ADULT = {"email": "adult@demo.com", "password": "demo1234"}


@pytest.fixture(scope="module")
def parent_token():
    r = requests.post(f"{API}/auth/login", json=PARENT, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def adult_token():
    r = requests.post(f"{API}/auth/login", json=ADULT, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def h(tok): return {"Authorization": f"Bearer {tok}"}


# ---------- Auth ----------
def test_login_parent():
    r = requests.post(f"{API}/auth/login", json=PARENT, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "token" in d and d["user"]["role"] == "parent"


def test_login_bad_credentials():
    r = requests.post(f"{API}/auth/login", json={"email": "parent@demo.com", "password": "wrong"}, timeout=30)
    assert r.status_code == 401


def test_me_requires_token():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


def test_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer bogus.token.here"}, timeout=30)
    assert r.status_code == 401


def test_me_ok(parent_token):
    r = requests.get(f"{API}/auth/me", headers=h(parent_token), timeout=30)
    assert r.status_code == 200
    assert r.json()["email"] == "parent@demo.com"


def test_signup_new_parent():
    email = f"TEST_{uuid.uuid4().hex[:8]}@demo.com"
    r = requests.post(f"{API}/auth/signup", json={"email": email, "password": "demo1234", "role": "parent"}, timeout=30)
    assert r.status_code == 200
    assert "token" in r.json()


# ---------- Profiles ----------
def test_parent_profiles_list(parent_token):
    r = requests.get(f"{API}/profiles", headers=h(parent_token), timeout=30)
    assert r.status_code == 200
    data = r.json()
    names = [p["name"] for p in data]
    assert "Aarav" in names and "Diya" in names
    assert "Priya" not in names
    aarav = next(p for p in data if p["name"] == "Aarav")
    diya = next(p for p in data if p["name"] == "Diya")
    assert aarav["stage"] == "child" and aarav["age"] == 9
    assert diya["stage"] == "puberty_teen"


def test_adult_sees_own_profile(adult_token):
    r = requests.get(f"{API}/profiles", headers=h(adult_token), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert any(p["name"] == "Priya" and p["stage"] == "adult" for p in data)


def test_create_child_profile(parent_token):
    payload = {"name": f"TEST_Kid_{uuid.uuid4().hex[:6]}", "dob": "2019-05-01", "gender": "male"}
    r = requests.post(f"{API}/profiles", json=payload, headers=h(parent_token), timeout=30)
    assert r.status_code == 200
    pid = r.json()["id"]
    g = requests.get(f"{API}/profiles/{pid}", headers=h(parent_token), timeout=30)
    assert g.status_code == 200 and g.json()["name"] == payload["name"]


def test_parent_cannot_access_adult_profile(parent_token, adult_token):
    r = requests.get(f"{API}/profiles", headers=h(adult_token), timeout=30)
    priya_id = next(p["id"] for p in r.json() if p["name"] == "Priya")
    r2 = requests.get(f"{API}/profiles/{priya_id}", headers=h(parent_token), timeout=30)
    assert r2.status_code == 403


def test_patch_puberty_toggle(parent_token):
    r = requests.get(f"{API}/profiles", headers=h(parent_token), timeout=30)
    aarav = next(p for p in r.json() if p["name"] == "Aarav")
    u = requests.patch(f"{API}/profiles/{aarav['id']}/puberty", json={"puberty_started": True}, headers=h(parent_token), timeout=30)
    assert u.status_code == 200
    assert u.json()["stage"] == "puberty_teen"
    # Revert
    requests.patch(f"{API}/profiles/{aarav['id']}/puberty", json={"puberty_started": False}, headers=h(parent_token), timeout=30)


# ---------- Logs ----------
def test_aarav_logs_and_stats(parent_token):
    r = requests.get(f"{API}/profiles", headers=h(parent_token), timeout=30)
    aarav = next(p for p in r.json() if p["name"] == "Aarav")
    logs = requests.get(f"{API}/profiles/{aarav['id']}/logs", headers=h(parent_token), timeout=30)
    assert logs.status_code == 200
    assert len(logs.json()) >= 5
    stats = requests.get(f"{API}/profiles/{aarav['id']}/stats", headers=h(parent_token), timeout=30)
    assert stats.status_code == 200
    s = stats.json()
    assert s["frequently_sick"] is True and s["sickness_3mo"] >= 4


def test_create_log(parent_token):
    r = requests.get(f"{API}/profiles", headers=h(parent_token), timeout=30)
    aarav = next(p for p in r.json() if p["name"] == "Aarav")
    payload = {"type": "note", "title": "TEST_note", "description": "x", "date": "2026-01-05"}
    c = requests.post(f"{API}/profiles/{aarav['id']}/logs", json=payload, headers=h(parent_token), timeout=30)
    assert c.status_code == 200
    listed = requests.get(f"{API}/profiles/{aarav['id']}/logs", headers=h(parent_token), timeout=30).json()
    assert any(l["title"] == "TEST_note" for l in listed)


# ---------- Vaccines ----------
def test_vaccination_schedule():
    r = requests.get(f"{API}/vaccinations/schedule", timeout=30)
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) == 13


def test_adult_checkups_female():
    r = requests.get(f"{API}/adult/checkups?gender=female", timeout=30)
    assert r.status_code == 200
    data = r.json()
    applies = {c["applies_to"] for c in data}
    assert "male" not in applies
    assert "female" in applies and "all" in applies


# ---------- AI ----------
def test_ai_ask_parent_context(parent_token):
    r = requests.get(f"{API}/profiles", headers=h(parent_token), timeout=30)
    aarav = next(p for p in r.json() if p["name"] == "Aarav")
    payload = {
        "question": "What are 3 healthy breakfast ideas for a 9-year-old in India?",
        "profile_id": aarav["id"], "age": 9, "gender": "male",
        "stage": "child", "context_type": "parent",
    }
    r = requests.post(f"{API}/ai/ask", json=payload, headers=h(parent_token), timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d["answer"], str) and len(d["answer"]) > 20
    assert "disclaimer" in d
    hist = requests.get(f"{API}/profiles/{aarav['id']}/ai-history", headers=h(parent_token), timeout=30)
    assert hist.status_code == 200 and len(hist.json()) >= 1


def test_ai_ask_teen_not_stored(parent_token):
    r = requests.get(f"{API}/profiles", headers=h(parent_token), timeout=30)
    diya = next(p for p in r.json() if p["name"] == "Diya")
    before = requests.get(f"{API}/profiles/{diya['id']}/ai-history", headers=h(parent_token), timeout=30).json()
    payload = {
        "question": "Is it normal to feel mood swings during puberty?",
        "profile_id": diya["id"], "age": 14, "gender": "female",
        "stage": "puberty_teen", "context_type": "teen",
    }
    r = requests.post(f"{API}/ai/ask", json=payload, headers=h(parent_token), timeout=90)
    assert r.status_code == 200
    after = requests.get(f"{API}/profiles/{diya['id']}/ai-history", headers=h(parent_token), timeout=30).json()
    assert len(after) == len(before)  # teen queries not stored
