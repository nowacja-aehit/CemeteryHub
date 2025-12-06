// Globalne zmienne
const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

let currentUser = null;
let lista_grobow = [];
let requests_list = [];
let services_list = [];
let messages_list = [];
let reservations_list = [];
let faq_list = [];
let articles_list = [];
let sections_list = [];
let categories_list = [];
let currentMonth = new Date();
let globalMonth = new Date();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardPanel = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userDisplay = document.getElementById('user-display');
const usersNav = document.getElementById('users-nav');
const gravesTableBody = document.getElementById('graves-table-body');
const requestsHistoryBody = document.getElementById('requests-history-body');
const messagesTableBody = document.getElementById('messages-table-body');
const reservationsTableBody = document.getElementById('reservations-table-body');
const faqListElement = document.getElementById('faqs-list');
const adminMapContainer = document.getElementById('admin-map-container');
const primaryServicesList = document.getElementById('primary-services-list');
const additionalServicesList = document.getElementById('additional-services-list');
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthDisplay = document.getElementById('calendar-month-display');
const globalCalendarGrid = document.getElementById('global-calendar-grid');
const globalCalendarMonthDisplay = document.getElementById('global-calendar-month-display');

// Start
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin script loaded');
  checkSession();
});

function checkSession() {
  const savedUser = localStorage.getItem('adminUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showDashboard();
    } catch (e) {
      console.error('Error parsing user', e);
      showLogin();
    }
  } else {
    showLogin();
  }
}

function showLogin() {
  if(loginScreen) loginScreen.classList.remove('hidden');
  if(dashboardPanel) dashboardPanel.classList.add('hidden');
}

function showDashboard() {
  if(loginScreen) loginScreen.classList.add('hidden');
  if(dashboardPanel) dashboardPanel.classList.remove('hidden');
  if(userDisplay && currentUser) userDisplay.textContent = `${currentUser.username} (${currentUser.role})`;
  
  if (currentUser && currentUser.role === 'admin' && usersNav) {
    usersNav.classList.remove('hidden');
  }

  loadAllData();
}

// Login Logic
document.addEventListener('DOMContentLoaded', () => {
  if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;

      try {
        const response = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
          currentUser = data.user;
          localStorage.setItem('adminUser', JSON.stringify(currentUser));
          showDashboard();
          if(loginError) loginError.classList.add('hidden');
        } else {
          if(loginError) loginError.classList.remove('hidden');
        }
      } catch (err) {
        console.error(err);
        if(loginError) {
          loginError.textContent = 'Connection error';
          loginError.classList.remove('hidden');
        }
      }
    });
  }
});

function logout() {
  localStorage.removeItem('adminUser');
  currentUser = null;
  showLogin();
}
window.logout = logout;
window.wyloguj = logout;

// Navigation
function switchView(viewName) {
  document.querySelectorAll('.view-content').forEach(el => el.classList.add('hidden'));
  const view = document.getElementById(`view-${viewName}`);
  if(view) view.classList.remove('hidden');
  
  // Reset guzików
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('bg-blue-50', 'text-blue-700');
    btn.classList.add('text-slate-600', 'hover:bg-slate-50');
  });
}
window.switchView = switchView;
window.zmienWidok = switchView;

// Data Loading
async function loadAllData() {
  try {
    const [gravesRes, reqRes, servRes, msgRes, resRes, faqRes, artRes, secRes, catRes] = await Promise.all([
      fetch(`${API_BASE}/api/graves`),
      fetch(`${API_BASE}/api/admin/service-requests`),
      fetch(`${API_BASE}/api/services`),
      fetch(`${API_BASE}/api/admin/contact`),
      fetch(`${API_BASE}/api/admin/reservations`),
      fetch(`${API_BASE}/api/faqs`),
      fetch(`${API_BASE}/api/articles`),
      fetch(`${API_BASE}/api/sections`),
      fetch(`${API_BASE}/api/categories`)
    ]);

    if (catRes.ok) categories_list = await catRes.json();
    if (secRes.ok) sections_list = await secRes.json();
    if (gravesRes.ok) {
      const rawGraves = await gravesRes.json();
      lista_grobow = rawGraves.map(g => {
        if (typeof g.coordinates === 'string') {
            const [x, y] = g.coordinates.split(',').map(Number);
            return { ...g, coordinates: { x, y } };
        }
        return g;
      });
      renderGravesTable();
      renderAdminMap();
    }
    if (reqRes.ok) {
      requests_list = await reqRes.json();
      renderRequestsBoard();
      renderCalendar();
      renderHistory();
    }
    if (servRes.ok) {
      services_list = await servRes.json();
      renderServicesList();
    }
    if (msgRes.ok) {
      messages_list = await msgRes.json();
      renderMessagesTable();
    }
    if (resRes.ok) {
      reservations_list = await resRes.json();
      renderReservationsTable();
    }

    renderGlobalCalendar();

    if (faqRes.ok) {
      faq_list = await faqRes.json();
      renderFaqList();
    }
    if (artRes.ok) {
      articles_list = await artRes.json();
      renderArticlesTable();
    }

  } catch (error) {
    console.error('Error loading admin data', error);
  }
}

// Graves Management
function renderGravesTable() {
  if(!gravesTableBody) return;
  gravesTableBody.innerHTML = lista_grobow.map(grob => `
    <tr class="bg-white border-b hover:bg-slate-50">
      <td class="px-6 py-4 font-medium text-slate-900">${grob.name}</td>
      <td class="px-6 py-4">Sek ${grob.section}, Rząd ${grob.row}, Msc ${grob.plot}</td>
      <td class="px-6 py-4">${grob.birthDate} - ${grob.deathDate}</td>
      <td class="px-6 py-4 flex gap-2">
        <button onclick="openEditGraveModal('${grob.id}')" class="font-medium text-blue-600 hover:underline">Edytuj</button>
        <button onclick="deleteGrave('${grob.id}')" class="font-medium text-red-600 hover:underline">Usuń</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminMap() {
  if(!adminMapContainer) return;
  const sectionsToRender = sections_list.length > 0 ? sections_list : [{name: 'A', rows: 4, cols: 6}, {name: 'B', rows: 4, cols: 6}];

  adminMapContainer.innerHTML = sectionsToRender.map(secObj => {
    const sectionName = secObj.name;
    const gridSize = { rows: secObj.rows || 4, cols: secObj.cols || 6 };
    const gravesInSection = lista_grobow.filter(g => g.section === sectionName);
    
    let cellsHtml = '';
    
    // Headers
    cellsHtml += `<div class="text-center text-slate-500 py-2 text-xs">Rząd</div>`;
    for(let i=0; i < gridSize.cols; i++) {
      cellsHtml += `<div class="text-center text-slate-500 py-2 text-xs">Msc ${i+1}</div>`;
    }

    // Rows
    for(let r=0; r < gridSize.rows; r++) {
      cellsHtml += `<div class="flex items-center justify-center text-slate-500 text-sm">${r + 1}</div>`;
      
      for(let c=0; c < gridSize.cols; c++) {
        const grave = lista_grobow.find(g => g.section === sectionName && g.coordinates.x === r && g.coordinates.y === c);
        
        let cellClass = '';
        let content = '';
        let clickAction = '';

        if (grave) {
          cellClass = 'bg-slate-600 border-slate-700 cursor-pointer opacity-80 hover:opacity-100';
          content = `<div class="text-white text-center px-1"><div class="text-[10px] truncate">${grave.name}</div></div>`;
          clickAction = `onclick="openEditGraveModal('${grave.id}')"`;
        } else {
          cellClass = 'bg-slate-100 border-slate-300 border-dashed hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-colors';
          content = `<div class="text-slate-400 text-center text-[10px]">+</div>`;
          clickAction = `onclick="openAddGraveModal('${sectionName}', ${r + 1}, ${c + 1}, ${r}, ${c})"`;
        }

        cellsHtml += `
          <div ${clickAction} class="h-16 rounded border-2 w-full flex items-center justify-center ${cellClass}" title="${grave ? grave.name : 'Dodaj grób'}">
            ${content}
          </div>
        `;
      }
    }

    return `
      <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
        <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="openEditSectionModal(${secObj.id})" class="text-slate-400 hover:text-blue-600" title="Edytuj Sekcję">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteSection('${secObj.id}')" class="text-slate-400 hover:text-red-600" title="Usuń Sekcję">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-slate-100 text-slate-900 rounded-full text-sm font-medium">Sektor ${sectionName}</span>
            <span class="text-slate-600 text-sm">${gravesInSection.length} zajętych</span>
            <span class="text-slate-400 text-xs">(${gridSize.rows}x${gridSize.cols})</span>
          </div>
          <hr class="border-slate-100">
          <div class="overflow-x-auto">
            <div class="inline-block min-w-full" style="min-width: 600px;">
              <div class="grid gap-2" style="grid-template-columns: 40px repeat(${gridSize.cols}, minmax(0, 1fr));">
                ${cellsHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if(window.lucide) window.lucide.createIcons();
}

function openAddGraveModal(section = '', row = '', plot = '', x = '', y = '') {
  document.getElementById('input-section').value = section;
  document.getElementById('input-row').value = row;
  document.getElementById('input-plot').value = plot;
  document.getElementById('input-coord-x').value = x;
  document.getElementById('input-coord-y').value = y;
  
  document.getElementById('add-grave-modal').classList.remove('hidden');
}
window.openAddGraveModal = openAddGraveModal;

function closeAddGraveModal() {
  document.getElementById('add-grave-modal').classList.add('hidden');
}
window.closeAddGraveModal = closeAddGraveModal;

document.addEventListener('DOMContentLoaded', () => {
  const addGraveForm = document.getElementById('add-grave-form');
  if(addGraveForm) {
    addGraveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      if (!formData.get('section') || !formData.get('row')) {
        alert('Wybierz lokalizację z mapy!');
        return;
      }

      const newGrave = {
        name: formData.get('name'),
        birthDate: formData.get('birthDate'),
        deathDate: formData.get('deathDate'),
        section: formData.get('section'),
        row: parseInt(formData.get('row')),
        plot: parseInt(formData.get('plot')),
        coordinates: {
          x: parseInt(formData.get('coord_x')),
          y: parseInt(formData.get('coord_y'))
        }
      };

      try {
        const res = await fetch(`${API_BASE}/api/admin/graves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGrave)
        });

        if (res.ok) {
          closeAddGraveModal();
          e.target.reset();
          loadAllData();
        } else {
          alert('Error adding grave');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function deleteGrave(id) {
  if (!confirm('Na pewno usunąć?')) return;
  
  fetch(`${API_BASE}/api/admin/graves/${id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) loadAllData();
      else alert('Error deleting');
    })
    .catch(err => console.error(err));
}
window.deleteGrave = deleteGrave;

// Edit Grave
function openEditGraveModal(id) {
  const grave = lista_grobow.find(g => g.id === id);
  if (!grave) return;

  document.getElementById('edit-grave-id').value = grave.id;
  document.getElementById('edit-grave-name').value = grave.name;
  document.getElementById('edit-grave-birthDate').value = grave.birthDate;
  document.getElementById('edit-grave-deathDate').value = grave.deathDate;
  document.getElementById('edit-grave-section').value = grave.section;
  document.getElementById('edit-grave-row').value = grave.row;
  document.getElementById('edit-grave-plot').value = grave.plot;

  document.getElementById('edit-grave-modal').classList.remove('hidden');
}
window.openEditGraveModal = openEditGraveModal;

function closeEditGraveModal() {
  document.getElementById('edit-grave-modal').classList.add('hidden');
}
window.closeEditGraveModal = closeEditGraveModal;

document.addEventListener('DOMContentLoaded', () => {
  const editGraveForm = document.getElementById('edit-grave-form');
  if(editGraveForm) {
    editGraveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-grave-id').value;
      const formData = new FormData(e.target);
      
      const updateData = {
        name: formData.get('name'),
        birthDate: formData.get('birthDate'),
        deathDate: formData.get('deathDate'),
        section: formData.get('section'),
        row: parseInt(formData.get('row')),
        plot: parseInt(formData.get('plot'))
      };

      try {
        const res = await fetch(`${API_BASE}/api/admin/graves/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (res.ok) {
          closeEditGraveModal();
          loadAllData();
        } else {
          alert('Update failed');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

// Sections Management
function openAddSectionModal() {
  document.getElementById('add-section-modal').classList.remove('hidden');
}
window.openAddSectionModal = openAddSectionModal;

function closeAddSectionModal() {
  document.getElementById('add-section-modal').classList.add('hidden');
}
window.closeAddSectionModal = closeAddSectionModal;

document.addEventListener('DOMContentLoaded', () => {
  const addSectionForm = document.getElementById('add-section-form');
  if(addSectionForm) {
    addSectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name').toUpperCase(),
        description: formData.get('description'),
        rows: parseInt(formData.get('rows')),
        cols: parseInt(formData.get('cols'))
      };

      try {
        const res = await fetch(`${API_BASE}/api/admin/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          closeAddSectionModal();
          e.target.reset();
          loadAllData();
        } else {
          alert('Error adding section');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function openEditSectionModal(id) {
  const section = sections_list.find(s => s.id === id);
  if (!section) return;

  document.getElementById('edit-section-id').value = section.id;
  document.getElementById('edit-section-name').value = section.name;
  document.getElementById('edit-section-description').value = section.description || '';
  document.getElementById('edit-section-rows').value = section.rows || 4;
  document.getElementById('edit-section-cols').value = section.cols || 6;

  document.getElementById('edit-section-modal').classList.remove('hidden');
}
window.openEditSectionModal = openEditSectionModal;

function closeEditSectionModal() {
  document.getElementById('edit-section-modal').classList.add('hidden');
}
window.closeEditSectionModal = closeEditSectionModal;

document.addEventListener('DOMContentLoaded', () => {
  const editSectionForm = document.getElementById('edit-section-form');
  if(editSectionForm) {
    editSectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-section-id').value;
      const formData = new FormData(e.target);
      
      const data = {
        name: formData.get('name').toUpperCase(),
        description: formData.get('description'),
        rows: parseInt(formData.get('rows')),
        cols: parseInt(formData.get('cols'))
      };

      try {
        const res = await fetch(`${API_BASE}/api/admin/sections/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          closeEditSectionModal();
          loadAllData();
        } else {
          alert('Update failed');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function deleteSection(id) {
  if (!confirm(`Usunąć sekcję? Groby zostaną osierocone!`)) return;
  
  fetch(`${API_BASE}/api/admin/sections/${id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) loadAllData();
      else alert('Delete failed');
    })
    .catch(err => console.error(err));
}
window.deleteSection = deleteSection;

// Articles Management
function renderArticlesTable() {
  const tbody = document.getElementById('articles-table-body');
  if (!tbody) return;

  tbody.innerHTML = articles_list.map(art => `
    <tr class="bg-white border-b hover:bg-slate-50">
      <td class="px-6 py-4 text-slate-500">${new Date(art.date).toLocaleDateString()}</td>
      <td class="px-6 py-4 font-medium text-slate-900">${art.title}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
          ${art.category}
        </span>
      </td>
      <td class="px-6 py-4 flex gap-2">
        <button onclick="openEditArticleModal('${art.id}')" class="text-blue-600 hover:text-blue-800"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
        <button onclick="deleteArticle('${art.id}')" class="text-red-600 hover:text-red-800"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </td>
    </tr>
  `).join('');
  
  if(window.lucide) window.lucide.createIcons();
}

function openAddArticleModal() {
  document.getElementById('article-modal-title').textContent = 'Dodaj Artykuł';
  document.getElementById('article-id').value = '';
  document.getElementById('add-article-form').reset();
  document.getElementById('add-article-modal').classList.remove('hidden');
  fillCategorySelect('article-category');
}
window.openAddArticleModal = openAddArticleModal;

function openEditArticleModal(id) {
  const art = articles_list.find(a => a.id == id);
  if (!art) return;

  document.getElementById('article-modal-title').textContent = 'Edytuj Artykuł';
  document.getElementById('article-id').value = art.id;
  document.getElementById('article-title').value = art.title;
  document.getElementById('article-category').value = art.category;
  document.getElementById('article-readTime').value = art.readTime;
  document.getElementById('article-date').value = art.date;
  document.getElementById('article-excerpt').value = art.excerpt;
  document.getElementById('article-content').value = art.content;

  document.getElementById('add-article-modal').classList.remove('hidden');
  fillCategorySelect('article-category', art.category);
}
window.openEditArticleModal = openEditArticleModal;

function closeAddArticleModal() {
  document.getElementById('add-article-modal').classList.add('hidden');
}
window.closeAddArticleModal = closeAddArticleModal;

document.addEventListener('DOMContentLoaded', () => {
  const addArticleForm = document.getElementById('add-article-form');
  if(addArticleForm) {
    addArticleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('article-id').value;
      const formData = new FormData(e.target);
      
      const data = {
        title: formData.get('title'),
        category: formData.get('category'),
        readTime: formData.get('readTime'),
        date: formData.get('date'),
        excerpt: formData.get('excerpt'),
        content: formData.get('content')
      };

      try {
        let res;
        if (id) {
          res = await fetch(`${API_BASE}/api/admin/articles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } else {
          res = await fetch(`${API_BASE}/api/admin/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }

        if (res.ok) {
          closeAddArticleModal();
          loadAllData();
        } else {
          alert('Save failed');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function deleteArticle(id) {
  if (!confirm('Usunąć artykuł?')) return;
  
  fetch(`${API_BASE}/api/admin/articles/${id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) loadAllData();
      else alert('Delete failed');
    })
    .catch(err => console.error(err));
}
window.deleteArticle = deleteArticle;

// Categories
function openCategoriesModal() {
  renderCategoriesList();
  document.getElementById('manage-categories-modal').classList.remove('hidden');
}
window.openCategoriesModal = openCategoriesModal;

function closeCategoriesModal() {
  document.getElementById('manage-categories-modal').classList.add('hidden');
}
window.closeCategoriesModal = closeCategoriesModal;

function renderCategoriesList() {
  const list = document.getElementById('categories-list');
  if (!list) return;

  if (categories_list.length === 0) {
    list.innerHTML = '<li class="p-3 text-center text-slate-500 text-sm">Brak kategorii.</li>';
    return;
  }

  list.innerHTML = categories_list.map(cat => `
    <li class="flex justify-between items-center p-3 hover:bg-slate-50">
      <span class="text-sm text-slate-700">${cat.name}</span>
      <button onclick="deleteCategory(${cat.id})" class="text-red-400 hover:text-red-600">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </li>
  `).join('');
  
  if(window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  const addCategoryForm = document.getElementById('add-category-form');
  if(addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name');

      try {
        const res = await fetch(`${API_BASE}/api/admin/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });

        if (res.ok) {
          e.target.reset();
          const catRes = await fetch(`${API_BASE}/api/categories`);
          if (catRes.ok) {
            categories_list = await catRes.json();
            renderCategoriesList();
          }
        } else {
          alert('Error adding category');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function deleteCategory(id) {
  if (!confirm('Usunąć kategorię?')) return;
  fetch(`${API_BASE}/api/admin/categories/${id}`, { method: 'DELETE' })
    .then(async res => {
      if (res.ok) {
        const catRes = await fetch(`${API_BASE}/api/categories`);
        if (catRes.ok) {
          categories_list = await catRes.json();
          renderCategoriesList();
        }
      }
    })
    .catch(err => console.error(err));
}
window.deleteCategory = deleteCategory;

function fillCategorySelect(selectId, selectedValue = '') {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Wybierz...</option>' + 
    categories_list.map(c => `<option value="${c.name}" ${c.name === selectedValue ? 'selected' : ''}>${c.name}</option>`).join('');
}

// Requests Views
function switchRequestView(view) {
  document.getElementById('req-view-board').classList.add('hidden');
  document.getElementById('req-view-calendar').classList.add('hidden');
  document.getElementById('req-view-history').classList.add('hidden');
  
  document.querySelectorAll('.req-nav-btn').forEach(btn => {
    btn.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
    btn.classList.add('text-slate-600');
  });

  document.getElementById(`req-view-${view}`).classList.remove('hidden');
  const activeBtn = document.getElementById(`req-nav-${view}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
    activeBtn.classList.remove('text-slate-600');
  }
}
window.switchRequestView = switchRequestView;
window.zmienWidokZgloszen = switchRequestView;

// Kanban Board
function renderRequestsBoard() {
  const columns = {
    pending: document.getElementById('board-pending'),
    in_progress: document.getElementById('board-in_progress'),
    completed: document.getElementById('board-completed')
  };
  
  const counters = {
    pending: document.getElementById('count-pending'),
    in_progress: document.getElementById('count-in_progress'),
    completed: document.getElementById('count-completed')
  };

  Object.values(columns).forEach(el => { if(el) el.innerHTML = ''; });
  
  const activeRequests = requests_list.filter(r => r.status !== 'cancelled' && r.status !== 'archived');

  activeRequests.forEach(req => {
    const col = columns[req.status] || columns['pending'];
    
    if (col) {
      const isCompleted = req.status === 'completed';
      const cardClass = isCompleted 
        ? 'bg-green-50 border-green-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow group relative'
        : 'bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow group relative';

      const currentServices = (req.services && req.services.length > 0) ? req.services : (req.service_type ? [req.service_type] : []);
      const serviceNames = currentServices.map(slug => {
          const s = services_list.find(srv => srv.slug === slug);
          return s ? s.name : slug;
      }).join(', ');

      const card = document.createElement('div');
      card.className = `p-3 rounded border ${cardClass}`;
      card.draggable = true;
      card.ondragstart = (e) => drag(e, req.id);
      card.onclick = (e) => {
        if (e.target.closest('button') || card.classList.contains('dragging')) return;
        openRequestDetails(req.id);
      };
      
      card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <span class="font-medium text-sm text-slate-900">${req.contactName || req.customer_name || 'Nieznany'}</span>
          <span class="text-xs text-slate-500">${new Date(req.date || req.created_at).toLocaleDateString()}</span>
        </div>
        <div class="text-xs text-slate-600 mb-2">
          <div class="font-medium ${isCompleted ? 'text-green-700' : 'text-blue-600'} mb-1 line-clamp-2" title="${serviceNames}">${serviceNames}</div>
          <div>Data: ${req.scheduled_date || 'Brak'}</div>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="font-semibold text-slate-700">${req.total_cost} PLN</span>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            ${isCompleted ? 
              `<button onclick="archiveRequest(${req.id}); event.stopPropagation();" class="text-slate-500 hover:text-slate-700" title="Archiwizuj">
                 <i data-lucide="archive" class="w-4 h-4"></i>
               </button>` : 
              `<button onclick="updateRequestStatus(${req.id}, 'cancelled'); event.stopPropagation();" class="text-red-400 hover:text-red-600">Anuluj</button>`
            }
          </div>
        </div>
      `;
      
      col.appendChild(card);
    }
  });

  if(counters.pending) counters.pending.textContent = activeRequests.filter(r => r.status === 'pending').length;
  if(counters.in_progress) counters.in_progress.textContent = activeRequests.filter(r => r.status === 'in_progress').length;
  if(counters.completed) counters.completed.textContent = activeRequests.filter(r => r.status === 'completed').length;

  if(window.lucide) window.lucide.createIcons();
}

// Drag & Drop
function allowDrop(ev) {
  ev.preventDefault();
}
window.allowDrop = allowDrop;
window.pozwolUpuscic = allowDrop;

function drag(ev, id) {
  ev.dataTransfer.setData("text", id);
}
window.drag = drag;

function drop(ev, status) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("text");
  updateRequestStatus(id, status);
}
window.drop = drop;
window.upusc = drop;

// Calendar View
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  if(calendarMonthDisplay) calendarMonthDisplay.textContent = new Date(year, month).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  if(!calendarGrid) return;
  
  calendarGrid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.innerHTML += `<div class="bg-white h-24"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRequests = requests_list.filter(r => r.scheduled_date === dateStr && r.status !== 'cancelled' && r.status !== 'archived');
    
    let tasksHtml = dayRequests.map(r => `
      <div class="text-[10px] px-1 py-0.5 rounded truncate mb-1 ${getStatusColor(r.status)}">
        ${r.customer_name}
      </div>
    `).join('');

    calendarGrid.innerHTML += `
      <div onclick="openDayDetails('${dateStr}')" class="bg-white h-24 p-1 border-t border-l border-slate-100 hover:bg-slate-50 transition-colors overflow-y-auto cursor-pointer">
        <div class="text-xs font-medium text-slate-400 mb-1">${day}</div>
        ${tasksHtml}
      </div>
    `;
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'archived': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}

function changeMonth(delta) {
  currentMonth.setMonth(currentMonth.getMonth() + delta);
  renderCalendar();
}
window.changeMonth = changeMonth;
window.zmienMiesiac = changeMonth;

// Global Calendar
function renderGlobalCalendar() {
  const year = globalMonth.getFullYear();
  const month = globalMonth.getMonth();
  
  if(globalCalendarMonthDisplay) globalCalendarMonthDisplay.textContent = new Date(year, month).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  if(!globalCalendarGrid) return;
  
  globalCalendarGrid.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    globalCalendarGrid.innerHTML += `<div class="bg-white h-24"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayReqs = requests_list.filter(r => r.scheduled_date === dateStr && r.status !== 'cancelled' && r.status !== 'archived');
    const dayRes = reservations_list.filter(r => r.scheduled_date === dateStr && r.status !== 'cancelled');

    let tasksHtml = '';
    
    dayReqs.forEach(r => {
        tasksHtml += `
          <div class="text-[10px] px-1 py-0.5 rounded truncate mb-1 ${getStatusColor(r.status)} border border-slate-200">
            ZGL: ${r.customer_name}
          </div>
        `;
    });

    dayRes.forEach(r => {
        tasksHtml += `
          <div class="text-[10px] px-1 py-0.5 rounded truncate mb-1 ${getReservationStatusColor(r.status)} border border-slate-200">
            REZ: ${r.name}
          </div>
        `;
    });

    globalCalendarGrid.innerHTML += `
      <div onclick="openGlobalDayDetails('${dateStr}')" class="bg-white h-24 p-1 border-t border-l border-slate-100 hover:bg-slate-50 transition-colors overflow-y-auto cursor-pointer">
        <div class="text-xs font-medium text-slate-400 mb-1">${day}</div>
        ${tasksHtml}
      </div>
    `;
  }
}

function changeGlobalMonth(delta) {
  globalMonth.setMonth(globalMonth.getMonth() + delta);
  renderGlobalCalendar();
}
window.changeGlobalMonth = changeGlobalMonth;
window.zmienMiesiacGlobalny = changeGlobalMonth;

function openGlobalDayDetails(dateStr) {
    const dayReqs = requests_list.filter(r => r.scheduled_date === dateStr && r.status !== 'cancelled');
    const dayRes = reservations_list.filter(r => r.scheduled_date === dateStr && r.status !== 'cancelled');
    
    const modal = document.getElementById('day-details-modal');
    const list = document.getElementById('day-details-list');
    const title = document.getElementById('day-details-title');
  
    title.textContent = new Date(dateStr).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
    let html = '';

    if (dayReqs.length === 0 && dayRes.length === 0) {
      html = `<div class="text-center text-slate-500 py-8">Brak wydarzeń.</div>`;
    } else {
        if (dayReqs.length > 0) {
            html += `<h4 class="text-xs font-bold text-slate-500 uppercase mb-2 mt-2">Zgłoszenia</h4>`;
            html += dayReqs.map(req => `
                <div onclick="openRequestDetails(${req.id}); closeDayDetailsModal()" class="bg-slate-50 p-3 rounded border border-slate-200 cursor-pointer hover:bg-white hover:shadow-sm transition-all mb-2">
                  <div class="flex justify-between items-start">
                    <span class="font-medium text-slate-900">${req.customer_name}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full ${getStatusColor(req.status)}">${req.status}</span>
                  </div>
                  <div class="text-sm text-slate-600 mt-1">${req.service_type}</div>
                </div>
            `).join('');
        }

        if (dayRes.length > 0) {
            html += `<h4 class="text-xs font-bold text-slate-500 uppercase mb-2 mt-2">Rezerwacje</h4>`;
            html += dayRes.map(res => `
                <div onclick="openEditReservationModal(${res.id}); closeDayDetailsModal()" class="bg-slate-50 p-3 rounded border border-slate-200 cursor-pointer hover:bg-white hover:shadow-sm transition-all mb-2">
                  <div class="flex justify-between items-start">
                    <span class="font-medium text-slate-900">${res.name}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full ${getReservationStatusColor(res.status)}">${res.status}</span>
                  </div>
                  <div class="text-sm text-slate-600 mt-1">${res.plot_type}</div>
                </div>
            `).join('');
        }
    }
  
    list.innerHTML = html;
    modal.classList.remove('hidden');
}
window.openGlobalDayDetails = openGlobalDayDetails;

// Messages
function renderMessagesTable() {
  if(!messagesTableBody) return;
  messagesTableBody.innerHTML = messages_list.map(msg => `
    <tr class="bg-white border-b hover:bg-slate-50">
      <td class="px-6 py-4 text-xs text-slate-500">${new Date(msg.created_at).toLocaleDateString()}</td>
      <td class="px-6 py-4 font-medium text-slate-900">${msg.name}</td>
      <td class="px-6 py-4 text-slate-600">${msg.email}</td>
      <td class="px-6 py-4 text-slate-600 max-w-xs truncate" title="${msg.message}">${msg.message}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getMessageStatusColor(msg.status)}">${msg.status || 'unread'}</span>
      </td>
      <td class="px-6 py-4 flex gap-2">
        <button onclick="openEditMessageModal(${msg.id})" class="text-blue-600 hover:text-blue-800"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
        <button onclick="deleteMessage(${msg.id})" class="text-red-600 hover:text-red-800"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </td>
    </tr>
  `).join('');
  if(window.lucide) window.lucide.createIcons();
}

function getMessageStatusColor(status) {
    switch(status) {
        case 'read': return 'bg-blue-100 text-blue-800';
        case 'replied': return 'bg-green-100 text-green-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

// Reservations
function renderReservationsTable() {
  if(!reservationsTableBody) return;
  reservationsTableBody.innerHTML = reservations_list.map(res => `
    <tr class="bg-white border-b hover:bg-slate-50">
      <td class="px-6 py-4 text-xs text-slate-500">
        <div>Utworzono: ${new Date(res.created_at).toLocaleDateString()}</div>
        ${res.scheduled_date ? `<div class="text-blue-600 font-medium mt-1">Zaplanowano: ${res.scheduled_date}</div>` : ''}
      </td>
      <td class="px-6 py-4 font-medium text-slate-900">${res.name}</td>
      <td class="px-6 py-4 text-slate-600">
        <div>${res.email}</div>
        <div class="text-xs text-slate-400">${res.phone}</div>
      </td>
      <td class="px-6 py-4 text-slate-600">
        <div class="text-xs font-semibold uppercase">${res.plot_type}</div>
        <div class="text-xs">Sek: ${res.section || 'Dowolna'}</div>
        ${res.consultation ? '<div class="text-xs text-blue-600 font-medium">Wymagana Konsultacja</div>' : ''}
        ${res.message ? `<div class="text-xs text-slate-500 mt-1 italic">"${res.message}"</div>` : ''}
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getReservationStatusColor(res.status)}">${res.status}</span>
      </td>
      <td class="px-6 py-4 flex gap-2">
        <button onclick="openEditReservationModal(${res.id})" class="text-blue-600 hover:text-blue-800"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
        <button onclick="deleteReservation(${res.id})" class="text-red-600 hover:text-red-800"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </td>
    </tr>
  `).join('');
  if(window.lucide) window.lucide.createIcons();
}

function getReservationStatusColor(status) {
    switch(status) {
        case 'confirmed': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-blue-100 text-blue-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

// FAQ
function renderFaqList() {
  if(!faqListElement) return;
  faqListElement.innerHTML = faq_list.map(faq => `
    <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-start">
      <div class="flex-1 mr-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold text-slate-400">#${faq.display_order}</span>
          <h3 class="font-semibold text-slate-900">${faq.question}</h3>
        </div>
        <p class="text-slate-600 text-sm">${faq.answer}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="openEditFaqModal(${faq.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
          <i data-lucide="edit-2" class="w-4 h-4"></i>
        </button>
        <button onclick="deleteFaq(${faq.id})" class="p-2 text-red-600 hover:bg-red-50 rounded">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('');
  if(window.lucide) window.lucide.createIcons();
}

function openAddFaqModal() {
  document.getElementById('faq-id').value = '';
  document.getElementById('faq-question').value = '';
  document.getElementById('faq-answer').value = '';
  document.getElementById('faq-order').value = '0';
  document.getElementById('add-faq-modal').classList.remove('hidden');
}
window.openAddFaqModal = openAddFaqModal;

function openEditFaqModal(id) {
  const faq = faq_list.find(f => f.id === id);
  if(!faq) return;
  
  document.getElementById('faq-id').value = faq.id;
  document.getElementById('faq-question').value = faq.question;
  document.getElementById('faq-answer').value = faq.answer;
  document.getElementById('faq-order').value = faq.display_order;
  document.getElementById('add-faq-modal').classList.remove('hidden');
}
window.openEditFaqModal = openEditFaqModal;

function closeAddFaqModal() {
  document.getElementById('add-faq-modal').classList.add('hidden');
}
window.closeAddFaqModal = closeAddFaqModal;

document.addEventListener('DOMContentLoaded', () => {
  const addFaqForm = document.getElementById('add-faq-form');
  if(addFaqForm) {
    addFaqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('faq-id').value;
      const formData = new FormData(e.target);
      const data = {
        question: formData.get('question'),
        answer: formData.get('answer'),
        display_order: parseInt(formData.get('display_order'))
      };

      try {
        let res;
        if (id) {
          res = await fetch(`${API_BASE}/api/admin/faqs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } else {
          res = await fetch(`${API_BASE}/api/admin/faqs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }

        if (res.ok) {
          closeAddFaqModal();
          loadAllData();
        } else {
          alert('Error saving FAQ');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function deleteFaq(id) {
  if(!confirm('Usunąć FAQ?')) return;
  fetch(`${API_BASE}/api/admin/faqs/${id}`, { method: 'DELETE' })
    .then(res => {
      if(res.ok) loadAllData();
    })
    .catch(err => console.error(err));
}
window.deleteFaq = deleteFaq;

// History View
function renderHistory() {
  const history = requests_list.filter(r => r.status === 'completed' || r.status === 'cancelled' || r.status === 'archived');
  
  if(requestsHistoryBody) {
    requestsHistoryBody.innerHTML = history.map(req => `
      <tr class="bg-white border-b hover:bg-slate-50">
        <td class="px-6 py-4">${new Date(req.date || req.created_at).toLocaleDateString()}</td>
        <td class="px-6 py-4">${req.scheduled_date || '-'}</td>
        <td class="px-6 py-4">${req.contactName || req.customer_name || 'Nieznany'}</td>
        <td class="px-6 py-4">${req.serviceType || req.service_type}</td>
        <td class="px-6 py-4">${req.total_cost || 0} PLN</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}">
            ${req.status}
          </span>
        </td>
      </tr>
    `).join('');
  }
}

// Request Details Modal
function toggleCustomerEdit() {
  const inputs = document.querySelectorAll('.customer-edit-input');
  const btn = document.getElementById('btn-edit-customer');
  const isDisabled = inputs[0].disabled;
  
  inputs.forEach(input => {
    input.disabled = !isDisabled;
    if(!isDisabled) {
        input.classList.add('bg-slate-50', 'text-slate-500');
        input.classList.remove('bg-white', 'text-slate-900');
    } else {
        input.classList.remove('bg-slate-50', 'text-slate-500');
        input.classList.add('bg-white', 'text-slate-900');
    }
  });
  
  if (isDisabled) {
    btn.textContent = 'Zablokuj';
    btn.classList.add('text-slate-600');
    btn.classList.remove('text-blue-600');
  } else {
    btn.textContent = 'Edytuj';
    btn.classList.remove('text-slate-600');
    btn.classList.add('text-blue-600');
  }
}
window.toggleCustomerEdit = toggleCustomerEdit;

function toggleServicesEdit() {
    const container = document.getElementById('services-edit-container');
    const btn = document.getElementById('btn-edit-services');
    const isHidden = container.classList.contains('hidden');

    if (isHidden) {
        container.classList.remove('hidden');
        btn.textContent = 'Ukryj listę';
    } else {
        container.classList.add('hidden');
        btn.textContent = 'Zarządzaj usługami';
    }
}
window.toggleServicesEdit = toggleServicesEdit;

function calculateRequestTotal() {
  const checkboxes = document.querySelectorAll('input[name="edit-services"]:checked');
  const discountInput = document.getElementById('edit-discount');
  const breakdownContainer = document.getElementById('payment-breakdown');
  const subtotalEl = document.getElementById('payment-subtotal');
  const totalEl = document.getElementById('payment-total');
  const totalInput = document.getElementById('edit-total-cost');

  if(!breakdownContainer) return;

  let subtotal = 0;
  let breakdownHtml = '';

  checkboxes.forEach(cb => {
      const price = parseFloat(cb.getAttribute('data-price'));
      const name = cb.nextElementSibling.textContent.split(' (')[0];
      
      subtotal += price;
      breakdownHtml += `
          <div class="flex justify-between text-slate-600 text-xs">
              <span>${name}</span>
              <span>${price.toFixed(2)} PLN</span>
          </div>
      `;
  });

  if (checkboxes.length === 0) {
      breakdownHtml = '<div class="text-slate-400 italic text-xs">Brak usług</div>';
  }

  const discount = parseFloat(discountInput.value) || 0;
  const total = Math.max(0, subtotal - discount);

  breakdownContainer.innerHTML = breakdownHtml;
  subtotalEl.textContent = `${subtotal.toFixed(2)} PLN`;
  totalEl.textContent = `${total.toFixed(2)} PLN`;
  totalInput.value = total.toFixed(2);
}
window.calculateRequestTotal = calculateRequestTotal;

function openRequestDetails(id) {
  const req = requests_list.find(r => r.id === id);
  if (!req) return;

  const content = document.getElementById('request-details-content');
  const actions = document.getElementById('request-details-actions');
  const modal = document.getElementById('request-details-modal');

  const currentServices = (req.services && req.services.length > 0) ? req.services : (req.service_type ? [req.service_type] : []);
  
  const selectedServicesList = currentServices.map(slug => {
      const s = services_list.find(srv => srv.slug === slug);
      return s ? `<span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs mr-1 mb-1 border border-blue-100">${s.name}</span>` : '';
  }).join('');

  const servicesCheckboxes = services_list.map(s => {
    const isChecked = currentServices.includes(s.slug);
    return `
      <label class="flex items-center gap-2 text-sm mb-1 p-1 hover:bg-slate-50 rounded">
        <input type="checkbox" name="edit-services" value="${s.slug}" data-price="${s.price}" ${isChecked ? 'checked' : ''} onchange="calculateRequestTotal()" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
        <span>${s.name} (${s.price} PLN)</span>
      </label>
    `;
  }).join('');

  content.innerHTML = `
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="space-y-2">
        <div class="flex justify-between items-center">
            <label class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Dane Klienta</label>
            <button onclick="toggleCustomerEdit()" id="btn-edit-customer" class="text-xs text-blue-600 hover:underline font-medium">Edytuj</button>
        </div>
        <input type="text" id="edit-customer-name" value="${req.contactName || req.customer_name || ''}" disabled class="customer-edit-input w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-500" placeholder="Imię i nazwisko">
        <input type="email" id="edit-email" value="${req.contactEmail || req.email || ''}" disabled class="customer-edit-input w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-500" placeholder="Email">
        <input type="text" id="edit-phone" value="${req.contactPhone || req.phone || ''}" disabled class="customer-edit-input w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-500" placeholder="Telefon">
      </div>
      <div>
        <div class="flex justify-between items-center mb-1">
            <label class="block text-slate-500 text-xs uppercase tracking-wide">Usługi</label>
            <button onclick="toggleServicesEdit()" id="btn-edit-services" class="text-xs text-blue-600 hover:underline font-medium">Zarządzaj usługami</button>
        </div>
        <div class="mb-2 min-h-[24px]">
            ${selectedServicesList || '<span class="text-slate-400 italic text-xs">Brak usług</span>'}
        </div>
        <div id="services-edit-container" class="hidden max-h-48 overflow-y-auto border border-slate-200 rounded p-2 bg-white mb-2 shadow-inner">
            ${servicesCheckboxes}
        </div>
        <div class="mb-2">
            <label class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Data Realizacji</label>
            <input type="date" id="edit-scheduled-date" value="${req.scheduled_date || ''}" class="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        
        <!-- Płatności -->
        <div class="bg-slate-50 p-3 rounded border border-slate-200 mb-2">
            <h4 class="text-xs font-bold text-slate-500 uppercase mb-2">Płatności</h4>
            <div id="payment-breakdown" class="space-y-1 text-sm mb-2 border-b border-slate-200 pb-2">
                <!-- JS injected -->
            </div>
            <div class="flex justify-between items-center mb-1 text-xs">
                <span class="text-slate-600">Podsuma:</span>
                <span id="payment-subtotal" class="font-medium">0.00 PLN</span>
            </div>
            <div class="flex justify-between items-center mb-1 text-xs">
                <span class="text-slate-600">Rabat:</span>
                <div class="flex items-center">
                    <span class="text-slate-500 mr-1">-</span>
                    <input type="number" id="edit-discount" value="${req.discount || 0}" step="0.01" min="0" onchange="calculateRequestTotal()" onkeyup="calculateRequestTotal()" class="w-16 text-right text-xs border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <span class="text-slate-500 ml-1">PLN</span>
                </div>
            </div>
            <div class="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                <span class="font-bold text-slate-700 text-sm">Suma:</span>
                <span id="payment-total" class="font-bold text-base text-slate-900">0.00 PLN</span>
                <input type="hidden" id="edit-total-cost" value="${req.total_cost}"> 
            </div>
        </div>
      </div>
      <div class="col-span-2">
        <label class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Status</label>
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}">${req.status}</span>
      </div>
      
      <div class="col-span-2 grid grid-cols-2 gap-4">
        <div>
            <label class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Notatki Klienta</label>
            <textarea id="edit-notes" readonly class="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none h-20 bg-slate-100 text-slate-600 cursor-not-allowed">${req.notes || ''}</textarea>
        </div>
        <div>
            <label class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Notatki Admina</label>
            <textarea id="edit-admin-notes" class="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 bg-yellow-50">${req.admin_notes || ''}</textarea>
        </div>
      </div>
    </div>
  `;

  let actionBtns = `
    <button onclick="saveRequestDetails(${req.id})" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm mr-auto">Zapisz</button>
  `;
  
  if (req.status === 'completed') {
    actionBtns += `
      <button onclick="archiveRequest(${req.id})" class="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 text-sm">Archiwizuj</button>
    `;
  } else if (req.status !== 'cancelled' && req.status !== 'archived') {
    actionBtns += `
      <button onclick="updateRequestStatus(${req.id}, 'cancelled'); closeRequestDetailsModal()" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded text-sm">Anuluj</button>
      <button onclick="closeRequestDetailsModal()" class="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm">Zamknij</button>
    `;
  } else {
    actionBtns += `
      <button onclick="closeRequestDetailsModal()" class="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm">Zamknij</button>
    `;
  }

  actions.innerHTML = actionBtns;
  modal.classList.remove('hidden');
  
  calculateRequestTotal();
}
window.openRequestDetails = openRequestDetails;

async function saveRequestDetails(id) {
    const customerName = document.getElementById('edit-customer-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const totalCost = document.getElementById('edit-total-cost').value;
    const discount = document.getElementById('edit-discount').value;
    const scheduledDate = document.getElementById('edit-scheduled-date').value;
    const notes = document.getElementById('edit-notes').value; 
    const adminNotes = document.getElementById('edit-admin-notes').value;
    
    const selectedServices = Array.from(document.querySelectorAll('input[name="edit-services"]:checked')).map(cb => cb.value);
    const primaryService = selectedServices.length > 0 ? selectedServices[0] : '';

    try {
        const res = await fetch(`${API_BASE}/api/admin/service-requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                customer_name: customerName,
                email: email,
                phone: phone,
                service_type: primaryService, 
                services: selectedServices,
                total_cost: totalCost,
                discount: discount,
                scheduled_date: scheduledDate,
                admin_notes: adminNotes
            })
        });

        if (res.ok) {
            const reqRes = await fetch(`${API_BASE}/api/admin/service-requests`);
            if (reqRes.ok) {
                requests_list = await reqRes.json();
                renderRequestsBoard();
                renderCalendar();
                renderHistory();
                alert('Zapisano!');
                closeRequestDetailsModal();
            }
        } else {
            alert('Błąd zapisu');
        }
    } catch (err) {
        console.error(err);
        alert('Błąd');
    }
}
window.saveRequestDetails = saveRequestDetails;

function closeRequestDetailsModal() {
  document.getElementById('request-details-modal').classList.add('hidden');
}
window.closeRequestDetailsModal = closeRequestDetailsModal;

async function archiveRequest(id) {
  if(!confirm('Archiwizować?')) return;
  await updateRequestStatus(id, 'archived');
  closeRequestDetailsModal();
}
window.archiveRequest = archiveRequest;

// Day Details Modal
function openDayDetails(dateStr) {
  const dayReqs = requests_list.filter(r => r.scheduled_date === dateStr && r.status !== 'cancelled');
  const modal = document.getElementById('day-details-modal');
  const list = document.getElementById('day-details-list');
  const title = document.getElementById('day-details-title');

  title.textContent = new Date(dateStr).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (dayReqs.length === 0) {
    list.innerHTML = `<div class="text-center text-slate-500 py-8">Brak zgłoszeń.</div>`;
  } else {
    list.innerHTML = dayReqs.map(req => `
      <div onclick="openRequestDetails(${req.id}); closeDayDetailsModal()" class="bg-slate-50 p-3 rounded border border-slate-200 cursor-pointer hover:bg-white hover:shadow-sm transition-all">
        <div class="flex justify-between items-start">
          <span class="font-medium text-slate-900">${req.customer_name}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${getStatusColor(req.status)}">${req.status}</span>
        </div>
        <div class="text-sm text-slate-600 mt-1">${req.service_type}</div>
      </div>
    `).join('');
  }

  modal.classList.remove('hidden');
}
window.openDayDetails = openDayDetails;

function closeDayDetailsModal() {
  document.getElementById('day-details-modal').classList.add('hidden');
}
window.closeDayDetailsModal = closeDayDetailsModal;

async function updateRequestStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/service-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      const reqRes = await fetch(`${API_BASE}/api/admin/service-requests`);
      if (reqRes.ok) {
        requests_list = await reqRes.json();
        renderRequestsBoard();
        renderCalendar();
        renderHistory();
      }
    } else {
      alert('Status update failed');
    }
  } catch (err) {
    console.error(err);
  }
}
window.updateRequestStatus = updateRequestStatus;

// Services Management
function renderServicesList() {
  const primary = services_list.filter(s => s.category === 'primary');
  const additional = services_list.filter(s => s.category === 'additional');
  const other = services_list.filter(s => s.category !== 'primary' && s.category !== 'additional');

  const renderItem = (s) => `
    <div class="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
      <div class="flex-1 grid grid-cols-2 gap-4 mr-4">
        <div>
            <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nazwa</label>
            <input type="text" id="name-${s.id}" value="${s.name}" class="w-full text-sm border-b border-slate-300 bg-transparent focus:border-blue-500 focus:outline-none pb-1">
        </div>
        <div>
            <label class="text-[10px] text-slate-500 uppercase font-bold block mb-1">Slug</label>
            <input type="text" id="slug-${s.id}" value="${s.slug}" class="w-full text-xs font-mono text-slate-600 border-b border-slate-300 bg-transparent focus:border-blue-500 focus:outline-none pb-1">
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-slate-500 text-sm">PLN</span>
        <input 
          type="number" 
          id="price-${s.id}"
          value="${s.price}" 
          class="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        <button onclick="saveService(${s.id})" class="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" title="Zapisz">
          <i data-lucide="save" class="w-4 h-4"></i>
        </button>
        <button onclick="deleteService(${s.id})" class="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" title="Usuń">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;

  if(primaryServicesList) primaryServicesList.innerHTML = primary.map(renderItem).join('');
  if(additionalServicesList) {
      let html = additional.map(renderItem).join('');
      if (other.length > 0) {
          html += `<h4 class="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">Inne</h4>`;
          html += other.map(renderItem).join('');
      }
      additionalServicesList.innerHTML = html;
  }
  
  if(window.lucide) window.lucide.createIcons();
}

async function deleteService(id) {
    if (!confirm('Usunąć usługę?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/services/${id}`, { method: 'DELETE' });
        if (res.ok) loadAllData();
        else alert('Błąd usuwania');
    } catch (e) { console.error(e); }
}
window.deleteService = deleteService;

async function saveService(id) {
  const newPrice = document.getElementById(`price-${id}`).value;
  const newName = document.getElementById(`name-${id}`).value;
  const newSlug = document.getElementById(`slug-${id}`).value;

  try {
    const res = await fetch(`${API_BASE}/api/admin/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          price: newPrice,
          name: newName,
          slug: newSlug
      })
    });

    if (res.ok) {
      alert('Zapisano');
      loadAllData();
    } else {
      alert('Błąd zapisu');
    }
  } catch (err) {
    console.error(err);
  }
}
window.saveService = saveService;

function openAddServiceModal() {
  document.getElementById('add-service-modal').classList.remove('hidden');
}
window.openAddServiceModal = openAddServiceModal;

function closeAddServiceModal() {
  document.getElementById('add-service-modal').classList.add('hidden');
}
window.closeAddServiceModal = closeAddServiceModal;

document.addEventListener('DOMContentLoaded', () => {
  const addServiceForm = document.getElementById('add-service-form');
  if(addServiceForm) {
    addServiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        slug: formData.get('slug'),
        price: formData.get('price'),
        category: formData.get('category')
      };

      try {
        const res = await fetch(`${API_BASE}/api/admin/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          closeAddServiceModal();
          e.target.reset();
          loadAllData();
        } else {
          alert('Error adding service');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

// Add Request Modal
function openAddRequestModal() {
  const modal = document.getElementById('add-request-modal');
  const datalist = document.getElementById('graves-datalist');
  const servicesList = document.getElementById('add-request-services-list');
  
  datalist.innerHTML = lista_grobow.map(g => 
    `<option value="${g.name} (Sek ${g.section}, Rząd ${g.row}, Msc ${g.plot})" data-id="${g.id}"></option>`
  ).join('');

  servicesList.innerHTML = services_list.map(s => `
    <label class="flex items-center gap-2 text-sm mb-1 p-1 hover:bg-slate-50 rounded">
      <input type="checkbox" name="new-request-services" value="${s.slug}" data-price="${s.price}" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
      <span>${s.name} (${s.price} PLN)</span>
    </label>
  `).join('');

  modal.classList.remove('hidden');
}
window.openAddRequestModal = openAddRequestModal;

function closeAddRequestModal() {
  document.getElementById('add-request-modal').classList.add('hidden');
}
window.closeAddRequestModal = closeAddRequestModal;

document.addEventListener('DOMContentLoaded', () => {
  const addRequestForm = document.getElementById('add-request-form');
  if(addRequestForm) {
    addRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const inputVal = document.getElementById('request-grave-input').value;
      const option = Array.from(document.getElementById('graves-datalist').options).find(opt => opt.value === inputVal);
      const graveId = option ? option.getAttribute('data-id') : null;

      if (!graveId) {
          alert('Wybierz grób z listy!');
          return;
      }

      const selectedServices = Array.from(document.querySelectorAll('input[name="new-request-services"]:checked'));
      const serviceSlugs = selectedServices.map(cb => cb.value);
      
      if (serviceSlugs.length === 0) {
          alert('Wybierz usługę!');
          return;
      }

      const totalCost = selectedServices.reduce((sum, cb) => sum + parseFloat(cb.getAttribute('data-price')), 0);

      const data = {
        grave_id: graveId,
        customer_name: formData.get('customer_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        service_type: serviceSlugs[0],
        services: serviceSlugs,
        total_cost: totalCost,
        notes: formData.get('notes'),
        date: new Date().toISOString().split('T')[0]
      };

      try {
        const res = await fetch(`${API_BASE}/api/service-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          closeAddRequestModal();
          e.target.reset();
          loadAllData();
        } else {
          alert('Error creating request');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

// Message Modal
function openEditMessageModal(id) {
    const msg = messages_list.find(m => m.id === id);
    if (!msg) return;

    document.getElementById('msg-id').value = msg.id;
    document.getElementById('msg-name').value = msg.name;
    document.getElementById('msg-email').value = msg.email;
    document.getElementById('msg-phone').value = msg.phone || '';
    document.getElementById('msg-message').value = msg.message;
    document.getElementById('msg-status').value = msg.status || 'unread';

    document.getElementById('edit-message-modal').classList.remove('hidden');
}
window.openEditMessageModal = openEditMessageModal;

function closeEditMessageModal() {
    document.getElementById('edit-message-modal').classList.add('hidden');
}
window.closeEditMessageModal = closeEditMessageModal;

document.addEventListener('DOMContentLoaded', () => {
  const editMessageForm = document.getElementById('edit-message-form');
  if(editMessageForm) {
    editMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('msg-id').value;
      const formData = new FormData(e.target);
      const data = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message'),
          status: formData.get('status')
      };

      try {
          const res = await fetch(`${API_BASE}/api/admin/contact/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });

          if (res.ok) {
              closeEditMessageModal();
              loadAllData();
          } else {
              alert('Update failed');
          }
      } catch (err) {
          console.error(err);
      }
    });
  }
});

function deleteMessage(id) {
    if (!confirm('Usunąć wiadomość?')) return;
    fetch(`${API_BASE}/api/admin/contact/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) loadAllData();
        else alert('Delete failed');
      })
      .catch(err => console.error(err));
}
window.deleteMessage = deleteMessage;

// Reservation Modal
function openEditReservationModal(id) {
    const res = reservations_list.find(r => r.id === id);
    if (!res) return;

    document.getElementById('res-id').value = res.id;
    document.getElementById('res-name').value = res.name;
    document.getElementById('res-email').value = res.email;
    document.getElementById('res-phone').value = res.phone;
    document.getElementById('res-section').value = res.section || '';
    document.getElementById('res-plot-type').value = res.plot_type;
    document.getElementById('res-status').value = res.status;
    document.getElementById('res-notes').value = res.notes || '';
    document.getElementById('res-consultation').checked = res.consultation;
    document.getElementById('res-scheduled-date').value = res.scheduled_date || '';

    document.getElementById('edit-reservation-modal').classList.remove('hidden');
}
window.openEditReservationModal = openEditReservationModal;

function closeEditReservationModal() {
    document.getElementById('edit-reservation-modal').classList.add('hidden');
}
window.closeEditReservationModal = closeEditReservationModal;

document.addEventListener('DOMContentLoaded', () => {
  const editReservationForm = document.getElementById('edit-reservation-form');
  if(editReservationForm) {
    editReservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('res-id').value;
      const formData = new FormData(e.target);
      const data = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          section: formData.get('section'),
          plot_type: formData.get('plot_type'),
          status: formData.get('status'),
          notes: formData.get('notes'),
          consultation: document.getElementById('res-consultation').checked,
          scheduled_date: document.getElementById('res-scheduled-date').value
      };

      try {
          const res = await fetch(`${API_BASE}/api/admin/reservations/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });

          if (res.ok) {
              closeEditReservationModal();
              loadAllData();
          } else {
              alert('Update failed');
          }
      } catch (err) {
          console.error(err);
      }
    });
  }
});

function deleteReservation(id) {
    if (!confirm('Usunąć rezerwację?')) return;
    fetch(`${API_BASE}/api/admin/reservations/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) loadAllData();
        else alert('Delete failed');
      })
      .catch(err => console.error(err));
}
window.deleteReservation = deleteReservation;
