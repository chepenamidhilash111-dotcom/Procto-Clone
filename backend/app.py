from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json
import os
import hashlib
import uuid
from datetime import datetime, timedelta
import functools

app = Flask(__name__)
app.secret_key = 'practo_clone_secret_key_2024'
CORS(app, supports_credentials=True, origins=["*"])

# ─── Data File Paths ─────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

DOCTORS_FILE     = os.path.join(DATA_DIR, 'doctors.json')
USERS_FILE       = os.path.join(DATA_DIR, 'users.json')
APPOINTMENTS_FILE= os.path.join(DATA_DIR, 'appointments.json')
REVIEWS_FILE     = os.path.join(DATA_DIR, 'reviews.json')

# ─── Helper Functions ─────────────────────────────────────────────────────────
def read_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated

def success(data=None, message='Success', status=200):
    resp = {'success': True, 'message': message}
    if data is not None:
        resp['data'] = data
    return jsonify(resp), status

def error(message='Error', status=400):
    return jsonify({'success': False, 'error': message}), status

# ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone    = data.get('phone', '').strip()

    if not all([name, email, password]):
        return error('Name, email and password are required')

    users = read_json(USERS_FILE)
    if any(u['email'] == email for u in users):
        return error('Email already registered')

    new_user = {
        'id': str(uuid.uuid4()),
        'name': name,
        'email': email,
        'password': hash_password(password),
        'phone': phone,
        'role': 'patient',
        'created_at': datetime.now().isoformat(),
        'profile_pic': None,
        'dob': data.get('dob', ''),
        'gender': data.get('gender', ''),
        'address': data.get('address', '')
    }
    users.append(new_user)
    write_json(USERS_FILE, users)

    session['user_id'] = new_user['id']
    safe_user = {k: v for k, v in new_user.items() if k != 'password'}
    return success(safe_user, 'Registration successful', 201)


@app.route('/api/auth/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error('Email and password required')

    users = read_json(USERS_FILE)
    user  = next((u for u in users if u['email'] == email), None)

    if not user or user['password'] != hash_password(password):
        return error('Invalid credentials', 401)

    session['user_id'] = user['id']
    safe_user = {k: v for k, v in user.items() if k != 'password'}
    return success(safe_user, 'Login successful')


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return success(message='Logged out successfully')


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_me():
    users = read_json(USERS_FILE)
    user  = next((u for u in users if u['id'] == session['user_id']), None)
    if not user:
        session.clear()
        return error('User not found', 404)
    safe_user = {k: v for k, v in user.items() if k != 'password'}
    return success(safe_user)


@app.route('/api/auth/update-profile', methods=['PUT'])
@login_required
def update_profile():
    data  = request.get_json()
    users = read_json(USERS_FILE)
    idx   = next((i for i, u in enumerate(users) if u['id'] == session['user_id']), None)
    if idx is None:
        return error('User not found', 404)

    allowed = ['name', 'phone', 'dob', 'gender', 'address']
    for field in allowed:
        if field in data:
            users[idx][field] = data[field]

    write_json(USERS_FILE, users)
    safe_user = {k: v for k, v in users[idx].items() if k != 'password'}
    return success(safe_user, 'Profile updated')

# ─── DOCTOR ROUTES ────────────────────────────────────────────────────────────

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    doctors    = read_json(DOCTORS_FILE)
    specialty  = request.args.get('specialty', '').strip()
    location   = request.args.get('location', '').strip()
    search     = request.args.get('search', '').strip().lower()
    sort_by    = request.args.get('sort', 'rating')
    online     = request.args.get('online', '').lower()
    min_fee    = request.args.get('min_fee', type=float)
    max_fee    = request.args.get('max_fee', type=float)

    filtered = doctors

    if specialty:
        filtered = [d for d in filtered if d['specialty'].lower() == specialty.lower()]
    if location:
        filtered = [d for d in filtered if d['location'].lower() == location.lower()]
    if search:
        filtered = [d for d in filtered if
                    search in d['name'].lower() or
                    search in d['specialty'].lower() or
                    search in d['clinic'].lower()]
    if online == 'true':
        filtered = [d for d in filtered if d.get('online_consultation')]
    if min_fee is not None:
        filtered = [d for d in filtered if d['fee'] >= min_fee]
    if max_fee is not None:
        filtered = [d for d in filtered if d['fee'] <= max_fee]

    if sort_by == 'rating':
        filtered.sort(key=lambda x: x['rating'], reverse=True)
    elif sort_by == 'fee_asc':
        filtered.sort(key=lambda x: x['fee'])
    elif sort_by == 'fee_desc':
        filtered.sort(key=lambda x: x['fee'], reverse=True)
    elif sort_by == 'experience':
        filtered.sort(key=lambda x: x['experience'], reverse=True)

    return success(filtered)


@app.route('/api/doctors/<int:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    doctors = read_json(DOCTORS_FILE)
    doctor  = next((d for d in doctors if d['id'] == doctor_id), None)
    if not doctor:
        return error('Doctor not found', 404)

    # Attach reviews
    reviews = read_json(REVIEWS_FILE)
    doctor_reviews = [r for r in reviews if r['doctor_id'] == doctor_id]
    doctor['reviews'] = doctor_reviews
    return success(doctor)


@app.route('/api/doctors/specialties', methods=['GET'])
def get_specialties():
    doctors    = read_json(DOCTORS_FILE)
    specialties = sorted(list(set(d['specialty'] for d in doctors)))
    return success(specialties)


@app.route('/api/doctors/locations', methods=['GET'])
def get_locations():
    doctors   = read_json(DOCTORS_FILE)
    locations = sorted(list(set(d['location'] for d in doctors)))
    return success(locations)

# ─── APPOINTMENT ROUTES ───────────────────────────────────────────────────────

@app.route('/api/appointments', methods=['POST'])
@login_required
def book_appointment():
    data      = request.get_json()
    doctor_id = data.get('doctor_id')
    date      = data.get('date', '').strip()
    slot      = data.get('slot', '').strip()
    apt_type  = data.get('type', 'clinic')  # clinic or online
    notes     = data.get('notes', '').strip()

    if not all([doctor_id, date, slot]):
        return error('Doctor, date and slot are required')

    doctors = read_json(DOCTORS_FILE)
    doctor  = next((d for d in doctors if d['id'] == doctor_id), None)
    if not doctor:
        return error('Doctor not found', 404)

    # Check slot not already booked
    appointments = read_json(APPOINTMENTS_FILE)
    conflict = any(
        a['doctor_id'] == doctor_id and
        a['date'] == date and
        a['slot'] == slot and
        a['status'] not in ['cancelled']
        for a in appointments
    )
    if conflict:
        return error('This slot is already booked. Please choose another.')

    new_apt = {
        'id': str(uuid.uuid4()),
        'patient_id': session['user_id'],
        'doctor_id': doctor_id,
        'doctor_name': doctor['name'],
        'doctor_specialty': doctor['specialty'],
        'date': date,
        'slot': slot,
        'type': apt_type,
        'notes': notes,
        'status': 'confirmed',
        'created_at': datetime.now().isoformat(),
        'fee': doctor['fee']
    }
    appointments.append(new_apt)
    write_json(APPOINTMENTS_FILE, appointments)
    return success(new_apt, 'Appointment booked successfully', 201)


@app.route('/api/appointments/my', methods=['GET'])
@login_required
def my_appointments():
    appointments = read_json(APPOINTMENTS_FILE)
    user_apts    = [a for a in appointments if a['patient_id'] == session['user_id']]
    user_apts.sort(key=lambda x: x['created_at'], reverse=True)
    return success(user_apts)


@app.route('/api/appointments/<apt_id>/cancel', methods=['PUT'])
@login_required
def cancel_appointment(apt_id):
    appointments = read_json(APPOINTMENTS_FILE)
    idx = next((i for i, a in enumerate(appointments)
                if a['id'] == apt_id and a['patient_id'] == session['user_id']), None)
    if idx is None:
        return error('Appointment not found', 404)
    if appointments[idx]['status'] == 'cancelled':
        return error('Already cancelled')
    appointments[idx]['status'] = 'cancelled'
    appointments[idx]['cancelled_at'] = datetime.now().isoformat()
    write_json(APPOINTMENTS_FILE, appointments)
    return success(appointments[idx], 'Appointment cancelled')


@app.route('/api/appointments/doctor/<int:doctor_id>/booked-slots', methods=['GET'])
def get_booked_slots(doctor_id):
    date         = request.args.get('date', '')
    appointments = read_json(APPOINTMENTS_FILE)
    booked = [a['slot'] for a in appointments
              if a['doctor_id'] == doctor_id and
              a['date'] == date and
              a['status'] != 'cancelled']
    return success(booked)

# ─── REVIEWS ROUTES ───────────────────────────────────────────────────────────

@app.route('/api/reviews', methods=['POST'])
@login_required
def add_review():
    data      = request.get_json()
    doctor_id = data.get('doctor_id')
    rating    = data.get('rating')
    comment   = data.get('comment', '').strip()

    if not all([doctor_id, rating]):
        return error('Doctor ID and rating required')

    rating = int(rating)
    if rating < 1 or rating > 5:
        return error('Rating must be between 1 and 5')

    users = read_json(USERS_FILE)
    user  = next((u for u in users if u['id'] == session['user_id']), {})

    reviews = read_json(REVIEWS_FILE)

    # Prevent duplicate reviews
    existing = next((r for r in reviews
                     if r['doctor_id'] == doctor_id and
                     r['patient_id'] == session['user_id']), None)
    if existing:
        return error('You have already reviewed this doctor')

    new_review = {
        'id': str(uuid.uuid4()),
        'doctor_id': doctor_id,
        'patient_id': session['user_id'],
        'patient_name': user.get('name', 'Anonymous'),
        'rating': rating,
        'comment': comment,
        'created_at': datetime.now().isoformat()
    }
    reviews.append(new_review)
    write_json(REVIEWS_FILE, reviews)

    # Update doctor's average rating
    doctors       = read_json(DOCTORS_FILE)
    doctor_idx    = next((i for i, d in enumerate(doctors) if d['id'] == doctor_id), None)
    if doctor_idx is not None:
        doc_reviews   = [r for r in reviews if r['doctor_id'] == doctor_id]
        avg_rating    = sum(r['rating'] for r in doc_reviews) / len(doc_reviews)
        doctors[doctor_idx]['rating']        = round(avg_rating, 1)
        doctors[doctor_idx]['total_reviews'] = len(doc_reviews)
        write_json(DOCTORS_FILE, doctors)

    return success(new_review, 'Review added successfully', 201)


@app.route('/api/reviews/doctor/<int:doctor_id>', methods=['GET'])
def get_doctor_reviews(doctor_id):
    reviews        = read_json(REVIEWS_FILE)
    doctor_reviews = [r for r in reviews if r['doctor_id'] == doctor_id]
    doctor_reviews.sort(key=lambda x: x['created_at'], reverse=True)
    return success(doctor_reviews)

# ─── MEDICINES ROUTES ─────────────────────────────────────────────────────────

MEDICINES = [
    {"id": 1, "name": "Paracetamol 500mg", "brand": "Crocin", "category": "Analgesic", "price": 25, "stock": 500, "prescription": False},
    {"id": 2, "name": "Amoxicillin 500mg", "brand": "Novamox", "category": "Antibiotic", "price": 120, "stock": 200, "prescription": True},
    {"id": 3, "name": "Metformin 500mg", "brand": "Glycomet", "category": "Antidiabetic", "price": 45, "stock": 300, "prescription": True},
    {"id": 4, "name": "Atorvastatin 10mg", "brand": "Lipitor", "category": "Statin", "price": 85, "stock": 150, "prescription": True},
    {"id": 5, "name": "Omeprazole 20mg", "brand": "Omez", "category": "Antacid", "price": 55, "stock": 400, "prescription": False},
    {"id": 6, "name": "Cetirizine 10mg", "brand": "Zyrtec", "category": "Antihistamine", "price": 35, "stock": 350, "prescription": False},
    {"id": 7, "name": "Aspirin 75mg", "brand": "Ecosprin", "category": "Antiplatelet", "price": 20, "stock": 600, "prescription": False},
    {"id": 8, "name": "Ibuprofen 400mg", "brand": "Brufen", "category": "NSAID", "price": 30, "stock": 450, "prescription": False},
    {"id": 9, "name": "Azithromycin 500mg", "brand": "Zithromax", "category": "Antibiotic", "price": 95, "stock": 180, "prescription": True},
    {"id": 10, "name": "Losartan 50mg", "brand": "Cozaar", "category": "Antihypertensive", "price": 75, "stock": 220, "prescription": True},
    {"id": 11, "name": "Vitamin D3 60000 IU", "brand": "D-Rise", "category": "Supplement", "price": 110, "stock": 500, "prescription": False},
    {"id": 12, "name": "Multivitamin Tablets", "brand": "Revital", "category": "Supplement", "price": 250, "stock": 800, "prescription": False},
]

LAB_TESTS = [
    {"id": 1, "name": "Complete Blood Count (CBC)", "price": 299, "turnaround": "6 hours", "description": "Measures different components of blood"},
    {"id": 2, "name": "HbA1c Test", "price": 450, "turnaround": "12 hours", "description": "Checks average blood sugar over 3 months"},
    {"id": 3, "name": "Lipid Profile", "price": 399, "turnaround": "8 hours", "description": "Measures cholesterol and triglycerides"},
    {"id": 4, "name": "Liver Function Test (LFT)", "price": 599, "turnaround": "12 hours", "description": "Assesses liver health"},
    {"id": 5, "name": "Thyroid Profile (TSH, T3, T4)", "price": 699, "turnaround": "24 hours", "description": "Evaluates thyroid function"},
    {"id": 6, "name": "Vitamin B12 Test", "price": 549, "turnaround": "24 hours", "description": "Measures Vitamin B12 levels"},
    {"id": 7, "name": "Urine Routine Examination", "price": 149, "turnaround": "4 hours", "description": "Detects kidney or urinary tract issues"},
    {"id": 8, "name": "COVID-19 RT-PCR Test", "price": 499, "turnaround": "24 hours", "description": "Detects active COVID-19 infection"},
    {"id": 9, "name": "Dengue NS1 Antigen", "price": 799, "turnaround": "6 hours", "description": "Early detection of dengue fever"},
    {"id": 10, "name": "ECG (Electrocardiogram)", "price": 350, "turnaround": "Same day", "description": "Records heart's electrical activity"},
]

@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    search   = request.args.get('search', '').lower()
    category = request.args.get('category', '')
    result   = MEDICINES
    if search:
        result = [m for m in result if search in m['name'].lower() or search in m['brand'].lower()]
    if category:
        result = [m for m in result if m['category'].lower() == category.lower()]
    return success(result)


@app.route('/api/lab-tests', methods=['GET'])
def get_lab_tests():
    search = request.args.get('search', '').lower()
    result = LAB_TESTS
    if search:
        result = [t for t in result if search in t['name'].lower()]
    return success(result)

# ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    doctors      = read_json(DOCTORS_FILE)
    users        = read_json(USERS_FILE)
    appointments = read_json(APPOINTMENTS_FILE)
    reviews      = read_json(REVIEWS_FILE)

    total_revenue = sum(a['fee'] for a in appointments if a['status'] == 'confirmed')
    confirmed_apts = [a for a in appointments if a['status'] == 'confirmed']
    cancelled_apts = [a for a in appointments if a['status'] == 'cancelled']

    stats = {
        'total_doctors': len(doctors),
        'total_patients': len(users),
        'total_appointments': len(appointments),
        'confirmed_appointments': len(confirmed_apts),
        'cancelled_appointments': len(cancelled_apts),
        'total_reviews': len(reviews),
        'total_revenue': total_revenue,
        'recent_appointments': sorted(appointments, key=lambda x: x['created_at'], reverse=True)[:5]
    }
    return success(stats)

# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return success({'status': 'running', 'version': '1.0.0'})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
