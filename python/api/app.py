import os
import json
import subprocess
import sys
import platform
from datetime import datetime
from typing import Dict, Optional
from urllib.parse import quote_plus
import mysql.connector
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# Konfiguracja aplikacji
app = Flask(__name__, static_folder="../../public")
CORS(app, resources={r"/*": {"origins": "*"}})

# Konfiguracja bazy danych
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "../../cemetery.db")


def parse_mysql_kv(raw_connection: Optional[str]) -> Optional[Dict[str, str]]:
    """Return dict of MySQL connection parts from Azure-style key/value string."""
    if not raw_connection:
        return None
    entries = [chunk for chunk in raw_connection.split(";") if chunk.strip()]
    kv: Dict[str, str] = {}
    for entry in entries:
        if "=" not in entry:
            continue
        key, value = entry.split("=", 1)
        kv[key.strip().lower()] = value.strip()
    if not kv:
        return None
    return kv


def parse_mysql_connection_string(raw_connection: Optional[str]):
    """Parse key-value Azure MySQL connection string into SQLAlchemy URI."""
    kv = parse_mysql_kv(raw_connection)
    if not kv:
        return None

    db_name = kv.get("database") or kv.get("db")
    server = kv.get("server") or kv.get("host")
    user = kv.get("user id") or kv.get("user") or kv.get("uid")
    password = kv.get("password")
    port = kv.get("port", "3306")

    if not all([db_name, server, user, password]):
        return None

    db_name_str = str(db_name)
    server_str = str(server)
    user_str = str(user)
    password_str = str(password)

    ssl_params = []
    ssl_ca_env = os.getenv("AZURE_MYSQL_SSL_CA") or os.getenv("MYSQL_SSL_CA_PATH")
    default_ssl_ca = os.path.join(basedir, "certs", "DigiCertGlobalRootG2.crt.pem")
    if ssl_ca_env:
        ssl_params.append(f"ssl_ca={quote_plus(ssl_ca_env)}")
    elif os.path.exists(default_ssl_ca):
        ssl_params.append(f"ssl_ca={quote_plus(default_ssl_ca)}")

    ssl_disabled_flag = os.getenv("AZURE_MYSQL_SSL_DISABLED")
    if ssl_disabled_flag:
        ssl_params.append(f"ssl_disabled={ssl_disabled_flag}")

    query = f"?{'&'.join(ssl_params)}" if ssl_params else ""

    return (
        f"mysql+mysqlconnector://{quote_plus(user_str)}:{quote_plus(password_str)}@"
        f"{server_str}:{port}/{db_name_str}{query}"
    )


def ensure_mysql_database(raw_connection: Optional[str], drop_flag: bool = False) -> None:
    """Ensure target MySQL database exists; drop and recreate when requested."""
    kv = parse_mysql_kv(raw_connection)
    if not kv:
        return

    db_name = kv.get("database") or kv.get("db")
    host = kv.get("server") or kv.get("host")
    user = kv.get("user id") or kv.get("user") or kv.get("uid")
    password = kv.get("password")
    port = int(kv.get("port", "3306"))

    if not all([db_name, host, user, password]):
        return

    conn = mysql.connector.connect(host=host, user=user, password=password, port=port)
    conn.autocommit = True
    cursor = conn.cursor()
    if drop_flag:
        cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` DEFAULT CHARACTER SET utf8mb4")
    cursor.close()
    conn.close()


def resolve_database_uri():
    """Detect Azure MySQL settings or fall back to local SQLite for dev/tests."""
    azure_conn = os.getenv("AZURE_MYSQL_CONNECTIONSTRING")
    mysql_uri = parse_mysql_connection_string(azure_conn)
    if mysql_uri:
        return mysql_uri
    return f"sqlite:///{db_path}"

azure_conn_raw = os.getenv("AZURE_MYSQL_CONNECTIONSTRING")
clear_db_flag = os.getenv("CLEARDATABASE") == "1"
if azure_conn_raw:
    ensure_mysql_database(azure_conn_raw, drop_flag=clear_db_flag)

app.config["SQLALCHEMY_DATABASE_URI"] = resolve_database_uri()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

static_root = app.static_folder or ""

# Disable reloader watching for database file to prevent restart loops during tests
extra_files = []

db = SQLAlchemy(app)

# --- Modele Bazy Danych ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


def init_db_and_seed():
    """Ensure tables exist and create default admin if missing."""
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username="admin").first():
            admin = User(username="admin", role="admin")
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()


# Initialize database and seed admin on startup
init_db_and_seed()

class Grave(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.String(20))
    death_date = db.Column(db.String(20))
    section = db.Column(db.String(10))
    row = db.Column(db.String(10))
    plot = db.Column(db.String(10))
    coord_x = db.Column(db.Integer)
    coord_y = db.Column(db.Integer)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "birthDate": self.birth_date,
            "deathDate": self.death_date,
            "section": self.section,
            "row": self.row,
            "plot": self.plot,
            "coordinates": f"{self.coord_x},{self.coord_y}" if self.coord_x is not None and self.coord_y is not None else "0,0"
        }

class ServiceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    grave_id = db.Column(db.Integer, db.ForeignKey("grave.id"), nullable=False)
    service_type = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="pending")
    customer_name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    notes = db.Column(db.Text)
    scheduled_date = db.Column(db.String(20))
    services = db.Column(db.Text)
    total_cost = db.Column(db.Float)
    discount = db.Column(db.Float)
    admin_notes = db.Column(db.Text)

    def to_dict(self):
        raw_status = (self.status or "pending").lower()
        if raw_status in ["oczekujące", "oczekujace"]:
            status_value = "pending"
        elif raw_status in ["w trakcie", "in-progress", "in progress"]:
            status_value = "in_progress"
        elif raw_status in ["zakończone", "zakonczone"]:
            status_value = "completed"
        else:
            status_value = self.status or "pending"

        return {
            "id": self.id,
            "graveId": self.grave_id,
            "serviceType": self.service_type,
            "date": self.created_at.strftime("%Y-%m-%d") if self.created_at else "",
            "status": status_value,
            "contactName": self.customer_name,
            "contactEmail": self.email,
            "contactPhone": self.phone,
            "notes": self.notes,
            "scheduled_date": self.scheduled_date,
            "services": json.loads(self.services) if self.services else [],
            "total_cost": self.total_cost or 0,
            "discount": self.discount or 0,
            "admin_notes": self.admin_notes or ""
        }

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    section = db.Column(db.String(50))
    plot_type = db.Column(db.String(50))
    consultation = db.Column(db.Boolean)
    notes = db.Column(db.Text)
    admin_notes = db.Column(db.Text)
    status = db.Column(db.String(20), default="Nowa")
    scheduled_date = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "section": self.section,
            "plot_type": self.plot_type,
            "consultation": self.consultation,
            "notes": self.notes,
            "admin_notes": self.admin_notes,
            "status": self.status,
            "scheduled_date": self.scheduled_date,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }

class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    total_rows = db.Column(db.Integer)
    total_cols = db.Column(db.Integer)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "rows": self.total_rows,
            "cols": self.total_cols
        }

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    date = db.Column(db.String(20))
    excerpt = db.Column(db.Text)
    read_time = db.Column(db.String(20))
    is_visible = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "date": self.date,
            "excerpt": self.excerpt,
            "readTime": self.read_time,
            "isVisible": self.is_visible
        }

class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100))
    price = db.Column(db.Float)
    category = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "price": self.price,
            "category": self.category
        }

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default="Nowa")
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "message": self.message,
            "status": self.status,
            "admin_notes": self.admin_notes,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }

class FAQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "answer": self.answer,
            "display_order": self.display_order
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }

# --- Trasy (Routes) ---

@app.route("/")
def serve_index():
    return send_from_directory(os.path.join(static_root, "html"), "index.html")

@app.route("/admin")
def serve_admin():
    return send_from_directory(os.path.join(static_root, "html"), "admin.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(static_root, path)

# --- API Endpoints ---

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        user_payload = {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
        return jsonify({
            "message": "Zalogowano pomyślnie",
            "token": "fake-jwt-token",
            "success": True,
            "user": user_payload
        }), 200
    
    return jsonify({"message": "Błędny login lub hasło", "success": False}), 401

# --- Admin API ---

@app.route("/api/admin/dashboard", methods=["GET"])
def get_dashboard_data():
    try:
        # Stats
        graves_count = Grave.query.count()
        
        # Count pending requests (handle various status strings)
        pending_statuses = ["pending", "Nowe", "Oczekujące", "oczekujace", "new"]
        requests_count = ServiceRequest.query.filter(ServiceRequest.status.in_(pending_statuses)).count()
        
        messages_count = ContactMessage.query.filter(ContactMessage.status == "Nowa").count()
        reservations_count = Reservation.query.filter(Reservation.status == "Nowa").count()

        # Calendar Events
        events = []

        # Service Requests
        requests = ServiceRequest.query.all()
        for req in requests:
            # Prefer scheduled_date, fallback to created_at
            date_str = req.scheduled_date
            if not date_str and req.created_at:
                date_str = req.created_at.strftime("%Y-%m-%d")
            
            if date_str:
                # Normalize date format if needed, assuming YYYY-MM-DD stored
                events.append({
                    "id": f"req_{req.id}",
                    "title": f"Usługa: {req.service_type}",
                    "date": date_str,
                    "type": "request",
                    "status": req.status,
                    "details": f"Klient: {req.customer_name}"
                })

        # Reservations
        reservations = Reservation.query.all()
        for res in reservations:
            date_str = res.scheduled_date
            if not date_str and res.created_at:
                date_str = res.created_at.strftime("%Y-%m-%d")
                
            if date_str:
                events.append({
                    "id": f"res_{res.id}",
                    "title": f'Rezerwacja: {res.section or "Brak sekcji"}',
                    "date": date_str,
                    "type": "reservation",
                    "status": res.status,
                    "details": f"Klient: {res.name}"
                })

        # Messages
        messages = ContactMessage.query.all()
        for msg in messages:
            if msg.created_at:
                events.append({
                    "id": f"msg_{msg.id}",
                    "title": f"Wiadomość od {msg.name}",
                    "date": msg.created_at.strftime("%Y-%m-%d"),
                    "type": "message",
                    "status": msg.status,
                    "details": msg.message[:50] + "..." if msg.message else ""
                })

        return jsonify({
            "stats": {
                "graves": graves_count,
                "requests": requests_count,
                "messages": messages_count,
                "reservations": reservations_count
            },
            "events": events
        })
    except Exception as e:
        print(f"Dashboard Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "username": u.username,
        "role": u.role
    } for u in users])

@app.route("/api/admin/users", methods=["POST"])
def add_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "user")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    new_user = User(username=username, role=role)  # type: ignore[arg-type]
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role
    }), 201

@app.route("/api/admin/users/<int:id>", methods=["PUT"])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.json
    
    if "username" in data:
        existing = User.query.filter_by(username=data["username"]).first()
        if existing and existing.id != id:
            return jsonify({"message": "Username already exists"}), 400
        user.username = data["username"]
        
    if data.get("password"):
        user.set_password(data["password"])
        
    if "role" in data:
        user.role = data["role"]
        
    db.session.commit()
    return jsonify({
        "id": user.id,
        "username": user.username,
        "role": user.role
    })

@app.route("/api/admin/users/<int:id>", methods=["DELETE"])
def delete_user(id):
    user = User.query.get_or_404(id)
    if user.username == "admin": # Prevent deleting the main admin
        return jsonify({"message": "Cannot delete main admin user"}), 403
        
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})

@app.route("/api/graves", methods=["GET"])
def get_graves():
    query = Grave.query
    
    # Filter by name
    name = request.args.get("name")
    if name:
        query = query.filter(Grave.name.ilike(f"%{name}%"))
        
    # Filter by year of death
    year = request.args.get("year")
    if year:
        query = query.filter(Grave.death_date.contains(year))
        
    # Filter by section
    section = request.args.get("section")
    if section:
        query = query.filter(Grave.section.ilike(section))

    graves = query.all()
    return jsonify([g.to_dict() for g in graves])

@app.route("/api/admin/graves", methods=["GET"])
def get_admin_graves():
    return get_graves()

@app.route("/api/graves", methods=["POST"])
def add_grave():
    data = request.json
    coordinates = data.get("coordinates", "0,0")
    cx, cy = 0, 0
    if isinstance(coordinates, dict):
        cx = int(coordinates.get("x", 0))
        cy = int(coordinates.get("y", 0))
    elif isinstance(coordinates, str) and "," in coordinates:
        parts = coordinates.split(",")
        if len(parts) >= 2:
            cx = int(parts[0])
            cy = int(parts[1])

    new_grave = Grave(
        name=data.get("name"),
        birth_date=data.get("birthDate"),
        death_date=data.get("deathDate"),
        section=data.get("section"),
        row=data.get("row"),
        plot=data.get("plot"),
        coord_x=cx,
        coord_y=cy
    )
    db.session.add(new_grave)
    db.session.commit()
    return jsonify(new_grave.to_dict()), 201

@app.route("/api/admin/graves", methods=["POST"])
def add_admin_grave():
    return add_grave()

@app.route("/api/admin/graves/<int:id>", methods=["PUT", "PATCH"])
def update_grave(id):
    grave = Grave.query.get_or_404(id)
    data = request.json
    grave.name = data.get("name", grave.name)
    grave.birth_date = data.get("birthDate", grave.birth_date)
    grave.death_date = data.get("deathDate", grave.death_date)
    grave.section = data.get("section", grave.section)
    grave.row = data.get("row", grave.row)
    grave.plot = data.get("plot", grave.plot)
    
    coordinates = data.get("coordinates")
    if coordinates:
        if isinstance(coordinates, dict):
            grave.coord_x = int(coordinates.get("x", 0))
            grave.coord_y = int(coordinates.get("y", 0))
        elif isinstance(coordinates, str) and "," in coordinates:
            parts = coordinates.split(",")
            if len(parts) >= 2:
                grave.coord_x = int(parts[0])
                grave.coord_y = int(parts[1])
            else:
                # Fallback or ignore
                pass
        else:
             # Handle other cases or ignore
             pass

    db.session.commit()
    return jsonify(grave.to_dict())

@app.route("/api/graves/<int:id>", methods=["DELETE"])
def delete_grave(id):
    grave = Grave.query.get_or_404(id)
    db.session.delete(grave)
    db.session.commit()
    return jsonify({"message": "Usunięto grób"}), 200

@app.route("/api/admin/graves/<int:id>", methods=["DELETE"])
def delete_admin_grave(id):
    return delete_grave(id)

# --- Service Requests Endpoints ---

@app.route("/api/service-requests", methods=["POST"])
def add_service_request():
    data = request.json
    services = data.get("services") or []
    if not isinstance(services, list):
        services = [services]
    total_cost = data.get("total_cost")
    try:
        total_cost = float(total_cost) if total_cost is not None else None
    except (TypeError, ValueError):
        total_cost = None

    # Parse date
    date_str = data.get("date")
    created_at = datetime.now()
    if date_str:
        try:
            created_at = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            created_at = datetime.now()

    new_request = ServiceRequest(
        grave_id=data.get("graveId") or data.get("grave_id"),
        service_type=data.get("serviceType") or data.get("service_type"),
        created_at=created_at,
        status=data.get("status") or "pending",
        customer_name=data.get("contactName") or data.get("customer_name"),
        email=data.get("contactEmail") or data.get("email"),
        phone=data.get("contactPhone"),
        notes=data.get("notes"),
        scheduled_date=data.get("scheduled_date"),
        services=json.dumps(services) if services else None,
        total_cost=total_cost,
        discount=data.get("discount"),
        admin_notes=data.get("admin_notes")
    )
    db.session.add(new_request)
    db.session.commit()
    return jsonify({"message": "Zgłoszenie przyjęte"}), 201

@app.route("/api/admin/service-requests", methods=["GET"])
def get_service_requests():
    requests = ServiceRequest.query.all()
    return jsonify([r.to_dict() for r in requests])

@app.route("/api/admin/service-requests/<int:id>", methods=["PUT", "PATCH"])
def update_service_request(id):
    req = ServiceRequest.query.get_or_404(id)
    data = request.json
    req.status = data.get("status", req.status)
    req.notes = data.get("notes", req.notes)
    req.scheduled_date = data.get("scheduled_date", req.scheduled_date)
    req.customer_name = data.get("customer_name", data.get("contact_name", req.customer_name))
    req.email = data.get("email", data.get("contact_email", req.email))
    req.phone = data.get("phone", data.get("contact_phone", req.phone))
    services = data.get("services")
    if services is not None:
        if not isinstance(services, list):
            services = [services]
        req.services = json.dumps(services)
    total_cost = data.get("total_cost")
    if total_cost is not None:
        try:
            req.total_cost = float(total_cost)
        except (TypeError, ValueError):
            req.total_cost = req.total_cost
    if "discount" in data:
        try:
            req.discount = float(data.get("discount")) if data.get("discount") is not None else None
        except (TypeError, ValueError):
            req.discount = req.discount
    if "admin_notes" in data:
        req.admin_notes = data.get("admin_notes")
    db.session.commit()
    return jsonify(req.to_dict())

@app.route("/api/admin/service-requests/<int:id>", methods=["DELETE"])
def delete_service_request(id):
    req = ServiceRequest.query.get_or_404(id)
    db.session.delete(req)
    db.session.commit()
    return jsonify({"message": "Zgłoszenie usunięte"})

@app.route("/api/admin/service-requests/<int:id>/status", methods=["PATCH"])
def update_service_request_status(id):
    req = ServiceRequest.query.get_or_404(id)
    data = request.json or {}
    req.status = data.get("status", req.status)
    db.session.commit()
    return jsonify(req.to_dict())

# --- Reservations Endpoints ---

@app.route("/api/reservations", methods=["POST"])
def add_reservation():
    data = request.json
    new_reservation = Reservation(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        section=data.get("section"),
        plot_type=data.get("plot_type"),
        consultation=data.get("consultation", False),
        notes=data.get("message") or data.get("notes"),
        scheduled_date=data.get("date") # Mapping 'date' from frontend to 'scheduled_date' or just storing it
    )
    db.session.add(new_reservation)
    db.session.commit()
    return jsonify({"message": "Rezerwacja przyjęta"}), 201

@app.route("/api/admin/reservations", methods=["GET"])
def get_reservations():
    reservations = Reservation.query.all()
    return jsonify([r.to_dict() for r in reservations])

@app.route("/api/admin/reservations/<int:id>", methods=["PUT"])
def update_reservation(id):
    reservation = Reservation.query.get_or_404(id)
    data = request.json
    reservation.status = data.get("status", reservation.status)
    reservation.name = data.get("name", reservation.name)
    reservation.email = data.get("email", reservation.email)
    reservation.phone = data.get("phone", reservation.phone)
    reservation.section = data.get("section", reservation.section)
    reservation.plot_type = data.get("plot_type", reservation.plot_type)
    reservation.scheduled_date = data.get("scheduled_date", reservation.scheduled_date)
    reservation.notes = data.get("notes", reservation.notes)
    reservation.admin_notes = data.get("admin_notes", reservation.admin_notes)
    if "consultation" in data:
        reservation.consultation = bool(data.get("consultation"))
    
    db.session.commit()
    return jsonify(reservation.to_dict())

@app.route("/api/admin/reservations/<int:id>", methods=["DELETE"])
def delete_reservation(id):
    reservation = Reservation.query.get_or_404(id)
    db.session.delete(reservation)
    db.session.commit()
    return jsonify({"message": "Rezerwacja usunięta"})

# --- Services Endpoints ---

@app.route("/api/services", methods=["GET"])
def get_services():
    services = Service.query.all()
    return jsonify([s.to_dict() for s in services])

@app.route("/api/admin/services", methods=["POST"])
def add_service():
    data = request.json
    new_service = Service(
        name=data.get("name"),
        slug=data.get("slug"),
        price=data.get("price"),
        category=data.get("category")
    )
    db.session.add(new_service)
    db.session.commit()
    return jsonify(new_service.to_dict()), 201

@app.route("/api/admin/services/<int:id>", methods=["PUT"])
def update_service(id):
    service = Service.query.get_or_404(id)
    data = request.json
    service.name = data.get("name", service.name)
    service.slug = data.get("slug", service.slug)
    service.price = data.get("price", service.price)
    service.category = data.get("category", service.category)
    db.session.commit()
    return jsonify(service.to_dict())

@app.route("/api/admin/services/<int:id>", methods=["DELETE"])
def delete_service(id):
    service = Service.query.get_or_404(id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({"message": "Usługa usunięta"})

# --- Contact Endpoints ---

@app.route("/api/contact", methods=["POST", "OPTIONS"])
def submit_contact():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        message = data.get("message")
        
        if not all([name, email, message]):
            return jsonify({"error": "Missing required fields"}), 400
            
        new_message = ContactMessage(
            name=name,
            email=email,
            phone=phone,
            message=message,
            created_at=datetime.utcnow()
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({"message": "Message sent successfully"}), 201
        
    except Exception as e:
        print(f"Error in submit_contact: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/contact", methods=["GET"])
def get_contact_messages():
    messages = ContactMessage.query.all()
    return jsonify([m.to_dict() for m in messages])

@app.route("/api/admin/contact/<int:id>", methods=["PUT"])
def update_contact_message(id):
    message = ContactMessage.query.get_or_404(id)
    data = request.json
    message.status = data.get("status", message.status)
    message.admin_notes = data.get("admin_notes", message.admin_notes)
    db.session.commit()
    return jsonify(message.to_dict())

@app.route("/api/admin/contact/<int:id>", methods=["DELETE"])
def delete_contact_message(id):
    message = ContactMessage.query.get_or_404(id)
    db.session.delete(message)
    db.session.commit()
    return jsonify({"message": "Wiadomość usunięta"})

# --- FAQ Endpoints ---

@app.route("/api/faqs", methods=["GET"])
def get_faqs():
    faqs = FAQ.query.order_by(FAQ.display_order.asc()).all()
    return jsonify([f.to_dict() for f in faqs])

@app.route("/api/admin/faqs", methods=["POST"])
def add_faq():
    data = request.json
    new_faq = FAQ(
        question=data.get("question"),
        answer=data.get("answer"),
        display_order=data.get("display_order", 0)
    )
    db.session.add(new_faq)
    db.session.commit()
    return jsonify(new_faq.to_dict()), 201

@app.route("/api/admin/faqs/<int:id>", methods=["PUT"])
def update_faq(id):
    faq = FAQ.query.get_or_404(id)
    data = request.json
    faq.question = data.get("question", faq.question)
    faq.answer = data.get("answer", faq.answer)
    faq.display_order = data.get("display_order", faq.display_order)
    db.session.commit()
    return jsonify(faq.to_dict())

@app.route("/api/admin/faqs/<int:id>", methods=["DELETE"])
def delete_faq(id):
    faq = FAQ.query.get_or_404(id)
    db.session.delete(faq)
    db.session.commit()
    return jsonify({"message": "FAQ usunięte"})

# --- Articles Endpoints ---

@app.route("/api/articles", methods=["GET"])
def get_articles():
    articles = Article.query.filter_by(is_visible=True).all()
    return jsonify([a.to_dict() for a in articles])

@app.route("/api/admin/articles", methods=["GET"])
def get_admin_articles():
    articles = Article.query.all()
    return jsonify([a.to_dict() for a in articles])

@app.route("/api/admin/articles", methods=["POST"])
def add_article():
    data = request.json
    new_article = Article(
        title=data.get("title"),
        content=data.get("content"),
        category=data.get("category"),
        date=data.get("date"),
        excerpt=data.get("excerpt"),
        read_time=data.get("readTime"),
        is_visible=data.get("isVisible", True)
    )
    db.session.add(new_article)
    db.session.commit()
    return jsonify(new_article.to_dict()), 201

@app.route("/api/admin/articles/<int:id>", methods=["PUT"])
def update_article(id):
    article = Article.query.get_or_404(id)
    data = request.json
    article.title = data.get("title", article.title)
    article.content = data.get("content", article.content)
    article.category = data.get("category", article.category)
    article.date = data.get("date", article.date)
    article.excerpt = data.get("excerpt", article.excerpt)
    article.read_time = data.get("readTime", article.read_time)
    if "isVisible" in data:
        article.is_visible = data.get("isVisible")
    db.session.commit()
    return jsonify(article.to_dict())

@app.route("/api/admin/articles/<int:id>", methods=["DELETE"])
def delete_article(id):
    article = Article.query.get_or_404(id)
    db.session.delete(article)
    db.session.commit()
    return jsonify({"message": "Artykuł usunięty"})

# --- Sections Endpoints ---

@app.route("/api/sections", methods=["GET"])
def get_sections():
    sections = Section.query.all()
    return jsonify([s.to_dict() for s in sections])

@app.route("/api/admin/sections", methods=["POST"])
def add_section():
    data = request.json
    new_section = Section(
        name=data.get("name"),
        description=data.get("description"),
        total_rows=data.get("rows"),
        total_cols=data.get("cols")
    )
    db.session.add(new_section)
    db.session.commit()
    return jsonify(new_section.to_dict()), 201

@app.route("/api/admin/sections/<int:id>", methods=["PUT", "PATCH"])
def update_section(id):
    section = Section.query.get_or_404(id)
    data = request.json
    section.name = data.get("name", section.name)
    section.description = data.get("description", section.description)
    section.total_rows = data.get("rows", section.total_rows)
    section.total_cols = data.get("cols", section.total_cols)
    db.session.commit()
    return jsonify(section.to_dict())

@app.route("/api/admin/sections/<int:id>", methods=["DELETE"])
def delete_section(id):
    section = Section.query.get_or_404(id)
    db.session.delete(section)
    db.session.commit()
    return jsonify({"message": "Sekcja usunięta"})

# --- Categories Endpoints ---

@app.route("/api/categories", methods=["GET"])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])

@app.route("/api/admin/categories", methods=["POST"])
def add_category():
    data = request.json
    new_category = Category(name=data.get("name"))
    db.session.add(new_category)
    db.session.commit()
    return jsonify(new_category.to_dict()), 201

@app.route("/api/admin/categories/<int:id>", methods=["DELETE"])
# --- DevTools API ---

@app.route("/api/admin/dev/system-info", methods=["GET"])
def get_system_info():
    try:
        info = {
            "os": platform.system(),
            "os_release": platform.release(),
            "python_version": sys.version,
            "db_path": db_path,
            "graves_count": Grave.query.count(),
            "users_count": User.query.count(),
            "requests_count": ServiceRequest.query.count()
        }
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/dev/run-tests", methods=["GET"])
def run_tests():
    def generate():
        try:
            # Define categories and their paths relative to project root
            test_categories = [
                {"name": "Integration", "path": "tests", "pattern": "test_*.py"},
                {"name": "Unit", "path": "tests/unit", "pattern": "test_*.py"},
                {"name": "Security", "path": "tests/security", "pattern": "test_*.py"},
                {"name": "Performance", "path": "tests/performance", "pattern": "test_*.py"}
            ]

            all_tests = []

            for category in test_categories:
                cat_dir = os.path.join(basedir, "../../", category["path"])
                if os.path.exists(cat_dir):
                    # Only list files, not directories
                    files = [f for f in os.listdir(cat_dir) 
                            if os.path.isfile(os.path.join(cat_dir, f)) 
                            and f.startswith("test_") 
                            and f.endswith(".py")]
                    
                    # Sort integration tests numerically
                    if category["name"] == "Integration":
                        def sort_key(f):
                            parts = f.split("_")
                            if len(parts) > 1 and parts[1].isdigit():
                                return int(parts[1])
                            return f
                        files.sort(key=sort_key)
                    else:
                        files.sort()

                    for f in files:
                        all_tests.append({
                            "category": category["name"],
                            "file": f,
                            "rel_path": os.path.join(category["path"], f),
                            "type": "python"
                        })

            # Add Frontend Tests
            frontend_dir = os.path.join(basedir, "../../cementery")
            if os.path.exists(frontend_dir):
                all_tests.append({
                    "category": "Frontend",
                    "file": "Vitest Suite",
                    "type": "command",
                    "command": ["npm", "run", "test:run"],
                    "cwd": frontend_dir
                })
            
            for test in all_tests:
                start_time = datetime.now()
                
                if test.get("type") == "command":
                    cmd = test["command"]
                    # Handle Windows npm execution
                    if platform.system() == "Windows" and cmd[0] == "npm":
                        cmd[0] = "npm.cmd"
                        
                    process = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        cwd=test["cwd"]
                    )
                else:
                    process = subprocess.run(
                        [sys.executable, test["rel_path"], "-v"],
                        capture_output=True,
                        text=True,
                        cwd=os.path.join(basedir, "../../")
                    )

                duration = (datetime.now() - start_time).total_seconds()
                
                result = {
                    "name": f"[{test['category']}] {test['file']}",
                    "status": "PASS" if process.returncode == 0 else "FAIL",
                    "output": process.stdout + process.stderr,
                    "duration": duration
                }
                yield f"data: {json.dumps(result)}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream", headers={
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    })

@app.route("/api/admin/dev/seed-data", methods=["POST"])
def seed_data():
    try:
        import random
        from datetime import timedelta

        # 1. Sections
        sections = Section.query.all()
        if not sections:
             sections_data = [
                Section(name="A", description="Sektor zabytkowy", total_rows=10, total_cols=10),
                Section(name="B", description="Sektor główny", total_rows=15, total_cols=20),
                Section(name="C", description="Sektor nowy", total_rows=10, total_cols=15),
                Section(name="D", description="Urny", total_rows=5, total_cols=10)
            ]
             db.session.bulk_save_objects(sections_data)
             db.session.commit()
             sections = Section.query.all()

        # 2. Graves
        names = ["Jan", "Anna", "Piotr", "Maria", "Krzysztof", "Barbara", "Andrzej", "Ewa", "Stanisław", "Krystyna", "Tomasz", "Zofia", "Paweł", "Elżbieta", "Michał", "Jadwiga"]
        surnames = ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur"]
        
        new_graves = []
        for _ in range(50):
            name = f"{random.choice(names)} {random.choice(surnames)}"
            section = random.choice(sections).name
            
            # Random dates
            birth_year = random.randint(1920, 1990)
            death_year = birth_year + random.randint(20, 90)
            if death_year > 2025: death_year = 2025
            
            birth_date = f"{birth_year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
            death_date = f"{death_year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"

            grave = Grave(
                name=name,
                birth_date=birth_date,
                death_date=death_date,
                section=section,
                row=str(random.randint(1, 10)),
                plot=str(random.randint(1, 20)),
                coord_x=random.randint(0, 100),
                coord_y=random.randint(0, 100)
            )
            new_graves.append(grave)
        
        db.session.bulk_save_objects(new_graves)
        db.session.commit()
        graves = Grave.query.all()

        # 2.5 Service Categories
        service_categories = ["Sprzątanie", "Konserwacja", "Produkty", "Opieka", "Inne"]
        if Category.query.count() == 0:
            for cat_name in service_categories:
                db.session.add(Category(name=cat_name))
            db.session.commit()

        # 3. Services
        services_data = [
            Service(name="Sprzątanie grobu (mały)", slug="cleaning-small", price=100.0, category="Sprzątanie"),
            Service(name="Sprzątanie grobu (duży)", slug="cleaning-large", price=150.0, category="Sprzątanie"),
            Service(name="Mycie nagrobka", slug="washing", price=80.0, category="Konserwacja"),
            Service(name="Znicz duży", slug="candle-large", price=35.0, category="Produkty"),
            Service(name="Wiązanka kwiatów", slug="flowers", price=120.0, category="Produkty"),
            Service(name="Opieka całoroczna", slug="year-care", price=1200.0, category="Opieka")
        ]
        # Check if services exist to avoid duplicates if run multiple times (though clear-data is usually run first)
        if Service.query.count() == 0:
            db.session.bulk_save_objects(services_data)
            db.session.commit()
        
        services = Service.query.all()

        # 4. Service Requests (Focus on December 2025)
        requests = []
        statuses = ["pending", "in_progress", "completed", "cancelled"]
        
        for i in range(20):
            grave = random.choice(graves)
            service = random.choice(services)
            
            # Generate dates in December 2025
            day = random.randint(1, 31)
            date_str = f"2025-12-{day:02d}"
            created_date = datetime(2025, 12, day) - timedelta(days=random.randint(1, 5))
            
            req = ServiceRequest(
                grave_id=grave.id,
                service_type=service.name,
                created_at=created_date,
                status=random.choice(statuses),
                customer_name=f"Klient {i+1}",
                email=f"klient{i+1}@example.com",
                phone=f"500{random.randint(100000, 999999)}",
                notes=f"Proszę o wykonanie usługi w dniu {date_str}",
                scheduled_date=date_str,
                services=json.dumps([service.name]),
                total_cost=service.price,
                discount=0,
                admin_notes="Testowe zgłoszenie"
            )
            requests.append(req)
        
        db.session.bulk_save_objects(requests)

        # 5. Reservations (Some in December)
        reservations = []
        for i in range(10):
            day = random.randint(1, 31)
            date_str = f"2025-12-{day:02d}"
            
            res = Reservation(
                name=f"Rezerwujący {i+1}",
                email=f"rezerwacja{i+1}@example.com",
                phone=f"600{random.randint(100000, 999999)}",
                section=random.choice(sections).name,
                plot_type=random.choice(["Pojedynczy", "Podwójny", "Urna"]),
                consultation=random.choice([True, False]),
                notes="Chciałbym zarezerwować miejsce blisko alejki.",
                admin_notes="",
                status=random.choice(["Nowa", "Potwierdzona", "Anulowana"]),
                scheduled_date=date_str,
                created_at=datetime(2025, 12, day) - timedelta(days=random.randint(1, 10))
            )
            reservations.append(res)
        
        db.session.bulk_save_objects(reservations)

        # 6. Messages
        messages = []
        for i in range(10):
            day = random.randint(1, 31)
            msg = ContactMessage(
                name=f"Pytający {i+1}",
                email=f"pytanie{i+1}@example.com",
                phone=f"700{random.randint(100000, 999999)}",
                message="Czy cmentarz jest otwarty w święta?",
                status=random.choice(["Nowa", "Przeczytana", "Odpowiedziano"]),
                admin_notes="",
                created_at=datetime(2025, 12, day)
            )
            messages.append(msg)
        
        db.session.bulk_save_objects(messages)

        # 7. Articles
        articles_data = [
            Article(title="Godziny otwarcia w Grudniu", content="W okresie świątecznym cmentarz czynny do 22:00.", category="Aktualności", date="2025-12-01", excerpt="Sprawdź godziny otwarcia.", read_time="1 min", is_visible=True),
            Article(title="Przygotowania do zimy", content="Prosimy o zabezpieczenie nagrobków przed mrozem.", category="Porady", date="2025-11-15", excerpt="Jak dbać o nagrobek zimą?", read_time="3 min", is_visible=True),
            Article(title="Nowy sektor D otwarty", content="Oddajemy do użytku nowy sektor urnowy.", category="Inwestycje", date="2025-10-20", excerpt="Nowe miejsca na urny.", read_time="2 min", is_visible=True),
            Article(title="Msza Święta w Wigilię", content="Zapraszamy na mszę w kaplicy cmentarnej.", category="Wydarzenia", date="2025-12-24", excerpt="Harmonogram mszy.", read_time="1 min", is_visible=True)
        ]
        if Article.query.count() == 0:
            db.session.bulk_save_objects(articles_data)

        # 8. FAQ
        faq_data = [
            FAQ(question="Jakie są godziny otwarcia?", answer="Cmentarz jest otwarty codziennie od 7:00 do 20:00.", display_order=1),
            FAQ(question="Jak znaleźć grób?", answer="Skorzystaj z wyszukiwarki na stronie głównej lub w aplikacji.", display_order=2),
            FAQ(question="Czy można wjechać samochodem?", answer="Wjazd możliwy tylko dla osób niepełnosprawnych po kontakcie z biurem.", display_order=3)
        ]
        if FAQ.query.count() == 0:
            db.session.bulk_save_objects(faq_data)

        # 9. Extra Users
        if not User.query.filter_by(username="pracownik").first():
            worker = User(username="pracownik", role="user")
            worker.set_password("pracownik123")
            db.session.add(worker)

        db.session.commit()
        
        return jsonify({"message": "Baza danych została wypełniona przykładowymi danymi (Grudzień 2025)"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/dev/clear-data", methods=["POST"])
def clear_data():
    try:
        # Delete all data except admin user
        Grave.query.delete()
        ServiceRequest.query.delete()
        Reservation.query.delete()
        ContactMessage.query.delete()
        Article.query.delete()
        FAQ.query.delete()
        Service.query.delete()
        Category.query.delete()
        Section.query.delete()
        
        # Delete non-admin users
        User.query.filter(User.username != "admin").delete()
        
        db.session.commit()
        return jsonify({"message": "Baza danych wyczyszczona (zachowano konto admin)"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

def delete_category(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Kategoria usunięta"})

# --- Inicjalizacja ---

def init_db():
    with app.app_context():
        db.create_all()
        
        # Utwórz admina jeśli nie istnieje
        if not User.query.filter_by(username="admin").first():
            admin = User(username="admin")
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print("Utworzono użytkownika admin/admin123")

@app.route("/admin")
def admin_index():
    return send_from_directory(app.static_folder, "html/admin.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == "__main__":
    init_db()
    print("Serwer uruchomiony na http://localhost:5000")
    # Exclude database file from reloader watch list
    # Also exclude public folder if it's being watched (though Flask usually only watches .py)
    # But if the user is running tests that modify files, we want to be careful.
    # However, Flask reloader by default only watches .py files.
    # If the user is using VS Code Live Server, that's separate.
    # But if the user says "przeładowanie strony", it could be the browser reloading.
    
    app.run(debug=True, port=5000, use_reloader=True)
