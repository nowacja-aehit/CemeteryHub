// Global Configuration
const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

// Data Containers
let graveData = [];
let servicesList = [];
let additionalServicesList = [];
let articlesList = [];
let sectionsList = [];

// State
let selectedGrave = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Map Elements
const mapSectionsContainer = document.getElementById('map-sections');
const mapSelectedDetails = document.getElementById('map-selected-details');
const clearSelectionBtn = document.getElementById('clear-selection-btn');

// Service Elements
const serviceSelect = document.getElementById('service-select');
const additionalServicesContainer = document.getElementById('additional-services-container');
const serviceSelectedGraveInfo = document.getElementById('service-selected-grave-info');
const serviceSubmitBtn = document.getElementById('service-submit-btn');
const serviceForm = document.getElementById('service-form');

// Articles Elements
const articlesGrid = document.getElementById('articles-grid');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  
  renderGraves(graveData);
  setupTabs();
  setupSearch();
  setupModals();
  
  // Initialize Modules
  renderMap();
  renderServicesForm();
  renderArticles();
  renderFAQ();
  setupReservationForm();
  
  // Re-initialize icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

async function loadData() {
  try {
    const [gravesRes, servicesRes, sectionsRes, articlesRes] = await Promise.all([
      fetch(`${API_BASE}/api/graves`),
      fetch(`${API_BASE}/api/services`),
      fetch(`${API_BASE}/api/sections`),
      fetch(`${API_BASE}/api/articles`)
    ]);

    if (gravesRes.ok) {
        const rawGraves = await gravesRes.json();
        graveData = rawGraves.map(g => {
            // Parse coordinates if string "x,y"
            if (typeof g.coordinates === 'string') {
                const [x, y] = g.coordinates.split(',').map(Number);
                return { ...g, coordinates: { x, y } };
            }
            return g;
        });
    }

    if (servicesRes.ok) {
        const allServices = await servicesRes.json();
        servicesList = allServices.filter(s => s.category === 'primary');
        additionalServicesList = allServices.filter(s => s.category === 'additional');
    }

    if (sectionsRes.ok) {
        sectionsList = await sectionsRes.json();
    }

    if (articlesRes.ok) {
        articlesList = await articlesRes.json();
        renderArticles(); // Re-render articles after fetch
    }

  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Functions
function setupModals() {
  const modals = {
    'contact-btn': 'contact-modal',
    'faq-btn': 'faq-modal',
    'reservation-btn': 'reservation-modal'
  };

  Object.keys(modals).forEach(btnId => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modals[btnId]);
    if (btn && modal) {
      btn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      });
    }
  });

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.fixed'); // Find parent modal
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });
  });

  // Close on click outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('fixed')) {
      e.target.classList.add('hidden');
      e.target.classList.remove('flex');
    }
  });
}

function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  // Update buttons
  tabButtons.forEach(b => {
    if (b.dataset.tab === tabName) {
      b.classList.remove('text-slate-500', 'hover:text-slate-900');
      b.classList.add('bg-white', 'text-slate-950', 'shadow');
    } else {
      b.classList.add('text-slate-500', 'hover:text-slate-900');
      b.classList.remove('bg-white', 'text-slate-950', 'shadow');
    }
  });

  // Update content
  tabContents.forEach(content => {
    if (content.id === tabName) {
      content.classList.remove('hidden');
      content.classList.add('block');
    } else {
      content.classList.add('hidden');
      content.classList.remove('block');
    }
  });
}

function setupSearch() {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = graveData.filter(grave => 
      grave.name.toLowerCase().includes(term)
    );
    renderGraves(filtered);
  });
}

function renderGraves(graves) {
  if (graves.length === 0) {
    searchResults.innerHTML = `
      <div class="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        <p>Nie znaleziono wyników. Spróbuj użyć innego terminu wyszukiwania.</p>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = graves.map(grave => `
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 space-y-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">${grave.name}</h3>
            <div class="flex items-center gap-2 text-slate-600 mt-1 text-sm">
              <i data-lucide="calendar" class="w-4 h-4"></i>
              <span>${grave.birthDate} - ${grave.deathDate}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-slate-700 text-sm">
            <i data-lucide="map-pin" class="w-4 h-4 text-slate-500"></i>
            <span>Sekcja ${grave.section} • Rząd ${grave.row} • Miejsce ${grave.plot}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button onclick="selectGraveAndShowMap(${grave.id})" class="flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm transition-colors">
            <i data-lucide="map-pin" class="w-4 h-4 mr-2"></i>
            Zobacz na mapie
          </button>
          <button onclick="selectGraveAndShowServices(${grave.id})" class="flex items-center px-4 py-2 border border-slate-200 text-slate-900 rounded-md hover:bg-slate-100 text-sm transition-colors">
            <i data-lucide="wrench" class="w-4 h-4 mr-2"></i>
            Wybierz usługę
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// --- Map Logic ---
function renderMap() {
  const sectionsToRender = sectionsList.length > 0 ? sectionsList : [{name: 'A', rows: 4, cols: 6}, {name: 'B', rows: 4, cols: 6}];

  mapSectionsContainer.innerHTML = sectionsToRender.map(secObj => {
    const section = secObj.name;
    const gridSize = { rows: secObj.rows || 4, cols: secObj.cols || 6 };
    const sectionGraves = graveData.filter(g => g.section === section);
    
    // Generate Grid Cells
    let gridCellsHTML = '';
    
    // Column Headers
    gridCellsHTML += `<div class="text-center text-slate-500 py-2 text-xs">Rząd</div>`;
    for(let i=0; i < gridSize.cols; i++) {
      gridCellsHTML += `<div class="text-center text-slate-500 py-2 text-xs">Miejsce ${i+1}</div>`;
    }

    // Rows
    for(let rowIdx=0; rowIdx < gridSize.rows; rowIdx++) {
      // Row Label
      gridCellsHTML += `<div class="flex items-center justify-center text-slate-500 text-sm">${rowIdx + 1}</div>`;
      
      // Cells
      for(let colIdx=0; colIdx < gridSize.cols; colIdx++) {
        const grave = graveData.find(g => g.section === section && g.coordinates.x === rowIdx && g.coordinates.y === colIdx);
        const isSelected = selectedGrave && selectedGrave.id === grave?.id;
        
        let cellClass = 'bg-slate-200 border-slate-300 cursor-default';
        let content = '';
        let onClick = '';

        if (grave) {
          if (isSelected) {
            cellClass = 'bg-blue-600 border-blue-700 hover:bg-blue-700 cursor-pointer';
          } else {
            cellClass = 'bg-slate-600 border-slate-700 hover:bg-slate-700 hover:scale-105 cursor-pointer';
          }
          content = `<div class="text-white text-center px-1"><div class="text-[10px] truncate">${grave.name}</div></div>`;
          onClick = `onclick="handleMapGraveClick(${grave.id})"`;
        }

        gridCellsHTML += `
          <button ${onClick} class="h-16 rounded border-2 transition-all w-full ${cellClass}" ${!grave ? 'disabled' : ''} title="${grave ? grave.name : 'Dostępne'}">
            ${content}
          </button>
        `;
      }
    }

    return `
      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-slate-100 text-slate-900 rounded-full text-sm font-medium">Sekcja ${section}</span>
            <span class="text-slate-600 text-sm">${sectionGraves.length} miejsc zajętych</span>
          </div>
          <hr class="border-slate-100">
          <div class="overflow-x-auto">
            <div class="inline-block min-w-full" style="min-width: 600px;">
              <div class="grid gap-2" style="grid-template-columns: 40px repeat(${gridSize.cols}, minmax(0, 1fr));">
                ${gridCellsHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update Selected Details
  if (selectedGrave) {
    mapSelectedDetails.classList.remove('hidden');
    clearSelectionBtn.classList.remove('hidden');
    mapSelectedDetails.innerHTML = `
      <div class="space-y-3">
        <h3 class="text-blue-900 font-semibold">Wybrane miejsce</h3>
        <div class="grid md:grid-cols-2 gap-4 text-slate-700 text-sm">
          <div><span class="text-slate-600">Imię:</span> ${selectedGrave.name}</div>
          <div><span class="text-slate-600">Sekcja:</span> ${selectedGrave.section}</div>
          <div><span class="text-slate-600">Rząd:</span> ${selectedGrave.row}</div>
          <div><span class="text-slate-600">Miejsce:</span> ${selectedGrave.plot}</div>
          <div class="md:col-span-2"><span class="text-slate-600">Data:</span> ${selectedGrave.birthDate} - ${selectedGrave.deathDate}</div>
        </div>
      </div>
    `;
    
    clearSelectionBtn.onclick = () => {
      selectedGrave = null;
      renderMap();
      updateServiceSelection();
    };

  } else {
    mapSelectedDetails.classList.add('hidden');
    clearSelectionBtn.classList.add('hidden');
  }
}

function handleMapGraveClick(id) {
  selectedGrave = graveData.find(g => g.id === id);
  renderMap();
  updateServiceSelection();
}

function selectGraveAndShowMap(id) {
  selectedGrave = graveData.find(g => g.id === id);
  renderMap();
  updateServiceSelection();
  switchTab('map');
}

// --- Services Logic ---
function renderServicesForm() {
  // Helper to format price
  const formatPrice = (price) => typeof price === 'number' ? `${price.toFixed(2)} PLN` : price;

  // Populate Select
  serviceSelect.innerHTML = '<option value="">Wybierz usługę</option>' + 
    servicesList.map(s => `<option value="${s.slug}">${s.name} - ${formatPrice(s.price)}</option>`).join('');

  // Populate Grave Select
  const graveSelect = document.getElementById('service-grave-select');
  if (graveSelect) {
    graveSelect.innerHTML = '<option value="">-- Wybierz grób z listy --</option>' + 
      graveData.map(g => `<option value="${g.id}">${g.name} (Sektor ${g.section}, Rząd ${g.row}, Miejsce ${g.plot})</option>`).join('');
    
    graveSelect.addEventListener('change', (e) => {
      const selectedId = parseInt(e.target.value);
      if (selectedId) {
        selectedGrave = graveData.find(g => g.id === selectedId);
        updateServiceSelection();
      } else {
        selectedGrave = null;
        updateServiceSelection();
      }
    });
  }

  // Populate Checkboxes
  additionalServicesContainer.innerHTML = additionalServicesList.map(s => `
    <div class="flex items-center space-x-2">
      <input type="checkbox" id="${s.slug}" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
      <label for="${s.slug}" class="flex-1 cursor-pointer text-slate-700 text-sm">
        ${s.name} - ${formatPrice(s.price)}
      </label>
    </div>
  `).join('');

  // Handle Submit
  serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedGrave) return;

    // Simulate submission
    const originalBtnText = serviceSubmitBtn.innerText;
    serviceSubmitBtn.innerText = 'Wysyłanie...';
    serviceSubmitBtn.disabled = true;

    const formData = {
        graveId: selectedGrave.id,
        serviceType: serviceSelect.value,
        date: new Date().toISOString().split('T')[0],
        scheduled_date: serviceForm.querySelector('input[type="date"]').value,
        contactName: serviceForm.querySelector('input[placeholder="Podaj swoje imię i nazwisko"]').value,
        contactEmail: serviceForm.querySelector('input[type="email"]').value,
        contactPhone: serviceForm.querySelector('input[type="tel"]').value,
        notes: serviceForm.querySelector('textarea').value
    };

    try {
        const response = await fetch(`${API_BASE}/api/service-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert(`Zgłoszenie serwisowe dla ${selectedGrave.name} zostało pomyślnie wysłane! Wkrótce się z Tobą skontaktujemy.`);
            serviceForm.reset();
            selectedGrave = null;
            renderMap();
            updateServiceSelection();
        } else {
            alert('Wystąpił błąd podczas wysyłania zgłoszenia.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Wystąpił błąd połączenia.');
    } finally {
        serviceSubmitBtn.innerText = originalBtnText;
        serviceSubmitBtn.disabled = false;
    }
  });
}

function updateServiceSelection() {
  const graveSelect = document.getElementById('service-grave-select');
  
  if (selectedGrave) {
    serviceSelectedGraveInfo.classList.remove('hidden');
    serviceSelectedGraveInfo.innerHTML = `
      <div class="text-slate-900 font-medium">Wybrana lokalizacja: ${selectedGrave.name}</div>
      <div class="text-slate-600 text-sm">Sektor ${selectedGrave.section} • Rząd ${selectedGrave.row} • Miejsce ${selectedGrave.plot}</div>
    `;
    serviceSubmitBtn.disabled = false;
    serviceSubmitBtn.innerText = 'Wyślij zgłoszenie';
    serviceSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    
    // Sync select if it exists and values differ
    if (graveSelect && graveSelect.value != selectedGrave.id) {
        graveSelect.value = selectedGrave.id;
    }

  } else {
    serviceSelectedGraveInfo.classList.add('hidden');
    serviceSubmitBtn.disabled = true;
    serviceSubmitBtn.innerText = 'Proszę najpierw wybrać lokalizację';
    serviceSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    if (graveSelect) {
        graveSelect.value = "";
    }
  }
}

function selectGraveAndShowServices(id) {
  selectedGrave = graveData.find(g => g.id === id);
  renderMap();
  updateServiceSelection();
  switchTab('services');
}

// --- Articles Logic ---
function renderArticles() {
  const dataToRender = articlesList;
  window.currentArticles = dataToRender; // Store for modal access

  articlesGrid.innerHTML = dataToRender.map(article => `
    <div onclick="openArticleModal(${article.id})" class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
      <div class="space-y-4">
        <div class="space-y-2">
          <span class="inline-flex items-center rounded-full border border-transparent bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200/80">
            ${article.category}
          </span>
          <h3 class="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            ${article.title}
          </h3>
        </div>

        <p class="text-slate-600 text-sm line-clamp-3">
          ${article.excerpt}
        </p>

        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <div class="flex items-center gap-2 text-slate-500 text-xs">
            <i data-lucide="calendar" class="w-3 h-3"></i>
            <span>${new Date(article.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span class="text-slate-500 text-xs">${article.readTime}</span>
        </div>
        
        <button class="text-sm font-medium text-slate-900 hover:underline flex items-center mt-2 group-hover:gap-2 transition-all">
          Czytaj więcej
          <i data-lucide="arrow-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openArticleModal(id) {
    const article = window.currentArticles.find(a => a.id === id);
    if (!article) return;

    const modal = document.getElementById('article-modal');
    const container = document.getElementById('article-content-container');
    
    container.innerHTML = `
        <div class="space-y-6">
            <div class="space-y-2">
                <span class="inline-flex items-center rounded-full border border-transparent bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
                    ${article.category}
                </span>
                <h2 class="text-2xl font-bold text-slate-900">${article.title}</h2>
                <div class="flex items-center gap-4 text-slate-500 text-sm">
                    <div class="flex items-center gap-1">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                        <span>${new Date(article.date).toLocaleDateString('pl-PL', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        <span>${article.readTime}</span>
                    </div>
                </div>
            </div>
            
            <div class="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                ${article.content || article.excerpt}
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// --- FAQ Logic ---
async function renderFAQ() {
    try {
        const response = await fetch(`${API_BASE}/api/faqs`);
        const faqs = await response.json();
        const faqList = document.getElementById('faq-list');
        
        if (faqs && faqs.length > 0) {
            faqList.innerHTML = faqs.map(faq => `
                <div class="border-b border-gray-200 pb-2 last:border-0">
                    <h3 class="font-semibold text-slate-900 mb-1">${faq.question}</h3>
                    <p class="text-sm text-slate-600">${faq.answer}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error fetching FAQs:', error);
    }
}

// --- Reservation Logic ---
function setupReservationForm() {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Wysyłanie...';
        btn.disabled = true;

        const formData = {
            name: document.getElementById('res-name').value,
            email: document.getElementById('res-email').value,
            phone: document.getElementById('res-phone').value,
            date: document.getElementById('res-date').value,
            message: document.getElementById('res-message').value
        };

        try {
            const response = await fetch(`${API_BASE}/api/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Dziękujemy! Twoja rezerwacja została przyjęta. Skontaktujemy się wkrótce.');
                form.reset();
                document.getElementById('reservation-modal').classList.add('hidden');
                document.getElementById('reservation-modal').classList.remove('flex');
            } else {
                alert('Wystąpił błąd. Spróbuj ponownie.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Błąd połączenia.');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

