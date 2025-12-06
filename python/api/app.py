import os
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# Konfiguracja aplikacji
app = Flask(__name__, static_folder='../../public')
CORS(app)

# Konfiguracja bazy danych
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, '../../cemetery.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Modele Bazy Danych ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='user')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Grave(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.String(20))
    death_date = db.Column(db.String(20))
    section = db.Column(db.String(10))
    row = db.Column(db.String(10))
    plot = db.Column(db.String(10))
    coordinates = db.Column(db.String(50)) # Przechowywane jako "x,y"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'birthDate': self.birth_date,
            'deathDate': self.death_date,
            'section': self.section,
            'row': self.row,
            'plot': self.plot,
            'coordinates': self.coordinates
        }

class ServiceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    grave_id = db.Column(db.Integer, db.ForeignKey('grave.id'), nullable=False)
    service_type = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='Oczekujące')
    contact_name = db.Column(db.String(100))
    contact_email = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    notes = db.Column(db.Text)
    scheduled_date = db.Column(db.String(20))

    def to_dict(self):
        return {
            'id': self.id,
            'graveId': self.grave_id,
            'serviceType': self.service_type,
            'date': self.date,
            'status': self.status,
            'contactName': self.contact_name,
            'contactEmail': self.contact_email,
            'contactPhone': self.contact_phone,
            'notes': self.notes,
            'scheduled_date': self.scheduled_date
        }

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    date = db.Column(db.String(20))
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='Nowa')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'date': self.date,
            'message': self.message,
            'status': self.status
        }

class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    rows = db.Column(db.Integer)
    cols = db.Column(db.Integer)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'rows': self.rows,
            'cols': self.cols
        }

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    date = db.Column(db.String(20))
    excerpt = db.Column(db.Text)
    read_time = db.Column(db.String(20))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'date': self.date,
            'excerpt': self.excerpt,
            'readTime': self.read_time
        }

class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100))
    price = db.Column(db.Float)
    category = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'price': self.price,
            'category': self.category
        }

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    message = db.Column(db.Text)
    date = db.Column(db.String(20))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'message': self.message,
            'date': self.date
        }

class FAQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'question': self.question,
            'answer': self.answer,
            'display_order': self.display_order
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# --- Trasy (Routes) ---

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder + '/html', 'index.html')

@app.route('/admin')
def serve_admin():
    return send_from_directory(app.static_folder + '/html', 'admin.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# --- API Endpoints ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        return jsonify({'message': 'Zalogowano pomyślnie', 'token': 'fake-jwt-token', 'success': True}), 200
    
    return jsonify({'message': 'Błędny login lub hasło', 'success': False}), 401

@app.route('/api/graves', methods=['GET'])
def get_graves():
    graves = Grave.query.all()
    return jsonify([g.to_dict() for g in graves])

@app.route('/api/admin/graves', methods=['GET'])
def get_admin_graves():
    return get_graves()

@app.route('/api/graves', methods=['POST'])
def add_grave():
    data = request.json
    coordinates = data.get('coordinates', '0,0')
    if isinstance(coordinates, dict):
        coordinates = f"{coordinates.get('x', 0)},{coordinates.get('y', 0)}"

    new_grave = Grave(
        name=data.get('name'),
        birth_date=data.get('birthDate'),
        death_date=data.get('deathDate'),
        section=data.get('section'),
        row=data.get('row'),
        plot=data.get('plot'),
        coordinates=coordinates
    )
    db.session.add(new_grave)
    db.session.commit()
    return jsonify(new_grave.to_dict()), 201

@app.route('/api/admin/graves', methods=['POST'])
def add_admin_grave():
    return add_grave()

@app.route('/api/admin/graves/<int:id>', methods=['PUT', 'PATCH'])
def update_grave(id):
    grave = Grave.query.get_or_404(id)
    data = request.json
    grave.name = data.get('name', grave.name)
    grave.birth_date = data.get('birthDate', grave.birth_date)
    grave.death_date = data.get('deathDate', grave.death_date)
    grave.section = data.get('section', grave.section)
    grave.row = data.get('row', grave.row)
    grave.plot = data.get('plot', grave.plot)
    
    coordinates = data.get('coordinates')
    if coordinates:
        if isinstance(coordinates, dict):
            grave.coordinates = f"{coordinates.get('x', 0)},{coordinates.get('y', 0)}"
        else:
            grave.coordinates = coordinates

    db.session.commit()
    return jsonify(grave.to_dict())

@app.route('/api/graves/<int:id>', methods=['DELETE'])
def delete_grave(id):
    grave = Grave.query.get_or_404(id)
    db.session.delete(grave)
    db.session.commit()
    return jsonify({'message': 'Usunięto grób'}), 200

@app.route('/api/admin/graves/<int:id>', methods=['DELETE'])
def delete_admin_grave(id):
    return delete_grave(id)

# --- Service Requests Endpoints ---

@app.route('/api/service-requests', methods=['POST'])
def add_service_request():
    data = request.json
    new_request = ServiceRequest(
        grave_id=data.get('graveId') or data.get('grave_id'),
        service_type=data.get('serviceType') or data.get('service_type'),
        date=data.get('date') or datetime.now().strftime('%Y-%m-%d'),
        contact_name=data.get('contactName') or data.get('customer_name'),
        contact_email=data.get('contactEmail') or data.get('email'),
        contact_phone=data.get('contactPhone'),
        notes=data.get('notes'),
        scheduled_date=data.get('scheduled_date')
    )
    db.session.add(new_request)
    db.session.commit()
    return jsonify({'message': 'Zgłoszenie przyjęte'}), 201

@app.route('/api/admin/service-requests', methods=['GET'])
def get_service_requests():
    requests = ServiceRequest.query.all()
    return jsonify([r.to_dict() for r in requests])

@app.route('/api/admin/service-requests/<int:id>', methods=['PUT'])
def update_service_request(id):
    req = ServiceRequest.query.get_or_404(id)
    data = request.json
    req.status = data.get('status', req.status)
    req.notes = data.get('notes', req.notes)
    req.scheduled_date = data.get('scheduled_date', req.scheduled_date)
    db.session.commit()
    return jsonify(req.to_dict())

@app.route('/api/admin/service-requests/<int:id>', methods=['DELETE'])
def delete_service_request(id):
    req = ServiceRequest.query.get_or_404(id)
    db.session.delete(req)
    db.session.commit()
    return jsonify({'message': 'Zgłoszenie usunięte'})

# --- Reservations Endpoints ---

@app.route('/api/reservations', methods=['POST'])
def add_reservation():
    data = request.json
    new_reservation = Reservation(
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        date=data.get('date'),
        message=data.get('message')
    )
    db.session.add(new_reservation)
    db.session.commit()
    return jsonify({'message': 'Rezerwacja przyjęta'}), 201

@app.route('/api/admin/reservations', methods=['GET'])
def get_reservations():
    reservations = Reservation.query.all()
    return jsonify([r.to_dict() for r in reservations])

@app.route('/api/admin/reservations/<int:id>', methods=['PUT'])
def update_reservation(id):
    reservation = Reservation.query.get_or_404(id)
    data = request.json
    reservation.status = data.get('status', reservation.status)
    db.session.commit()
    return jsonify(reservation.to_dict())

@app.route('/api/admin/reservations/<int:id>', methods=['DELETE'])
def delete_reservation(id):
    reservation = Reservation.query.get_or_404(id)
    db.session.delete(reservation)
    db.session.commit()
    return jsonify({'message': 'Rezerwacja usunięta'})

# --- Services Endpoints ---

@app.route('/api/services', methods=['GET'])
def get_services():
    services = Service.query.all()
    return jsonify([s.to_dict() for s in services])

@app.route('/api/admin/services', methods=['POST'])
def add_service():
    data = request.json
    new_service = Service(
        name=data.get('name'),
        slug=data.get('slug'),
        price=data.get('price'),
        category=data.get('category')
    )
    db.session.add(new_service)
    db.session.commit()
    return jsonify(new_service.to_dict()), 201

@app.route('/api/admin/services/<int:id>', methods=['PUT'])
def update_service(id):
    service = Service.query.get_or_404(id)
    data = request.json
    service.name = data.get('name', service.name)
    service.slug = data.get('slug', service.slug)
    service.price = data.get('price', service.price)
    service.category = data.get('category', service.category)
    db.session.commit()
    return jsonify(service.to_dict())

@app.route('/api/admin/services/<int:id>', methods=['DELETE'])
def delete_service(id):
    service = Service.query.get_or_404(id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Usługa usunięta'})

# --- Contact Endpoints ---

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    new_message = ContactMessage(
        name=data.get('name'),
        email=data.get('email'),
        message=data.get('message'),
        date=data.get('date')
    )
    db.session.add(new_message)
    db.session.commit()
    return jsonify({'message': 'Wiadomość wysłana'}), 201

@app.route('/api/admin/contact', methods=['GET'])
def get_contact_messages():
    messages = ContactMessage.query.all()
    return jsonify([m.to_dict() for m in messages])

# --- FAQ Endpoints ---

@app.route('/api/faqs', methods=['GET'])
def get_faqs():
    faqs = FAQ.query.all()
    return jsonify([f.to_dict() for f in faqs])

@app.route('/api/admin/faqs', methods=['POST'])
def add_faq():
    data = request.json
    new_faq = FAQ(
        question=data.get('question'),
        answer=data.get('answer'),
        display_order=data.get('display_order', 0)
    )
    db.session.add(new_faq)
    db.session.commit()
    return jsonify(new_faq.to_dict()), 201

@app.route('/api/admin/faqs/<int:id>', methods=['PUT'])
def update_faq(id):
    faq = FAQ.query.get_or_404(id)
    data = request.json
    faq.question = data.get('question', faq.question)
    faq.answer = data.get('answer', faq.answer)
    faq.display_order = data.get('display_order', faq.display_order)
    db.session.commit()
    return jsonify(faq.to_dict())

@app.route('/api/admin/faqs/<int:id>', methods=['DELETE'])
def delete_faq(id):
    faq = FAQ.query.get_or_404(id)
    db.session.delete(faq)
    db.session.commit()
    return jsonify({'message': 'FAQ usunięte'})

# --- Articles Endpoints ---

@app.route('/api/articles', methods=['GET'])
def get_articles():
    articles = Article.query.all()
    return jsonify([a.to_dict() for a in articles])

@app.route('/api/admin/articles', methods=['POST'])
def add_article():
    data = request.json
    new_article = Article(
        title=data.get('title'),
        content=data.get('content'),
        category=data.get('category'),
        date=data.get('date'),
        excerpt=data.get('excerpt'),
        read_time=data.get('readTime')
    )
    db.session.add(new_article)
    db.session.commit()
    return jsonify(new_article.to_dict()), 201

@app.route('/api/admin/articles/<int:id>', methods=['PUT'])
def update_article(id):
    article = Article.query.get_or_404(id)
    data = request.json
    article.title = data.get('title', article.title)
    article.content = data.get('content', article.content)
    article.category = data.get('category', article.category)
    article.date = data.get('date', article.date)
    article.excerpt = data.get('excerpt', article.excerpt)
    article.read_time = data.get('readTime', article.read_time)
    db.session.commit()
    return jsonify(article.to_dict())

@app.route('/api/admin/articles/<int:id>', methods=['DELETE'])
def delete_article(id):
    article = Article.query.get_or_404(id)
    db.session.delete(article)
    db.session.commit()
    return jsonify({'message': 'Artykuł usunięty'})

# --- Sections Endpoints ---

@app.route('/api/sections', methods=['GET'])
def get_sections():
    sections = Section.query.all()
    return jsonify([s.to_dict() for s in sections])

@app.route('/api/admin/sections', methods=['POST'])
def add_section():
    data = request.json
    new_section = Section(
        name=data.get('name'),
        description=data.get('description'),
        rows=data.get('rows'),
        cols=data.get('cols')
    )
    db.session.add(new_section)
    db.session.commit()
    return jsonify(new_section.to_dict()), 201

@app.route('/api/admin/sections/<int:id>', methods=['PUT', 'PATCH'])
def update_section(id):
    section = Section.query.get_or_404(id)
    data = request.json
    section.name = data.get('name', section.name)
    section.description = data.get('description', section.description)
    section.rows = data.get('rows', section.rows)
    section.cols = data.get('cols', section.cols)
    db.session.commit()
    return jsonify(section.to_dict())

@app.route('/api/admin/sections/<int:id>', methods=['DELETE'])
def delete_section(id):
    section = Section.query.get_or_404(id)
    db.session.delete(section)
    db.session.commit()
    return jsonify({'message': 'Sekcja usunięta'})

# --- Categories Endpoints ---

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])

@app.route('/api/admin/categories', methods=['POST'])
def add_category():
    data = request.json
    new_category = Category(name=data.get('name'))
    db.session.add(new_category)
    db.session.commit()
    return jsonify(new_category.to_dict()), 201

@app.route('/api/admin/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Kategoria usunięta'})

# --- Inicjalizacja ---

def init_db():
    with app.app_context():
        db.create_all()
        
        # Utwórz admina jeśli nie istnieje
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Utworzono użytkownika admin/admin123")
        
        # Dodaj przykładowe dane jeśli baza pusta
        if not Grave.query.first():
            sample_grave = Grave(
                name="Jan Kowalski",
                birth_date="1950-01-01",
                death_date="2020-12-31",
                section="A",
                row="1",
                plot="1",
                coordinates="0,0"
            )
            db.session.add(sample_grave)
            db.session.commit()
            print("Dodano przykładowe dane")

        # Dodaj przykładowe sekcje
        if not Section.query.first():
            sections = [
                Section(name='A', description='Sektor główny', rows=4, cols=6),
                Section(name='B', description='Sektor boczny', rows=4, cols=6)
            ]
            db.session.bulk_save_objects(sections)
            db.session.commit()
            print("Dodano przykładowe sekcje")

        # Dodaj przykładowe artykuły
        if not Article.query.first():
            articles = [
                Article(
                    title='Wybór odpowiedniego materiału na nagrobek: kompletny przewodnik',
                    excerpt='Zrozumienie różnic pomiędzy granitem, marmurem i brązem może pomóc Ci podjąć świadomą decyzję, która będzie trwała przez pokolenia.',
                    content='Tutaj znajduje się pełna treść artykułu o wyborze materiałów na nagrobek. Granit jest najtrwalszy, marmur piękny ale delikatny, a brąz klasyczny.',
                    date='2024-11-15',
                    category='Materiały',
                    read_time='5 minut czytania'
                ),
                Article(
                    title='Konserwacja nagrobków: porady dotyczące pielęgnacji sezonowej',
                    excerpt='Dowiedz się, jak prawidłowo pielęgnować i konserwować nagrobki w różnych porach roku, aby zachować ich piękno i integralność.',
                    content='Pełna treść artykułu o konserwacji. Wiosną należy usunąć liście, latem myć wodą, jesienią zabezpieczyć przed mrozem.',
                    date='2024-11-10',
                    category='Konserwacja',
                    read_time='4 minuty czytania'
                ),
                Article(
                    title='Historia symboliki cmentarnej',
                    excerpt='Odkryj znaczenie symboli powszechnie spotykanych na nagrobkach – od aniołów i gołębi po krzyże i kwiaty.',
                    content='Pełna treść o symbolice. Anioł oznacza opiekę, gołąb pokój, a złamana kolumna przerwane życie.',
                    date='2024-11-05',
                    category='Historia',
                    read_time='7 minut czytania'
                )
            ]
            db.session.bulk_save_objects(articles)
            db.session.commit()
            print("Dodano przykładowe artykuły")

        # Dodaj przykładowe FAQ
        if not FAQ.query.first():
            faqs = [
                FAQ(question='Jak znaleźć grób?', answer='Użyj wyszukiwarki na stronie głównej wpisując imię i nazwisko zmarłego.'),
                FAQ(question='Jak zamówić usługę?', answer='Przejdź do zakładki "Usługi", wybierz grób i wypełnij formularz.'),
                FAQ(question='Czy cmentarz jest otwarty w święta?', answer='Tak, cmentarz jest otwarty codziennie od 7:00 do 21:00.'),
                FAQ(question='Jak zgłosić usterkę?', answer='Skontaktuj się z biurem administracji telefonicznie lub mailowo.')
            ]
            db.session.bulk_save_objects(faqs)
            db.session.commit()
            print("Dodano przykładowe FAQ")

        # Dodaj przykładowe usługi
        if not Service.query.first():
            services = [
                Service(name='Czyszczenie nagrobków', slug='czyszczenie', price=150.0, category='primary'),
                Service(name='Naprawa nagrobków', slug='naprawa', price=300.0, category='primary')
            ]
            db.session.bulk_save_objects(services)
            db.session.commit()
            print("Dodano przykładowe usługi")

if __name__ == '__main__':
    init_db()
    print("Serwer uruchomiony na http://localhost:5000")
    app.run(debug=True, port=5000)
