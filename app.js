// app.js — App Routing, Dashboard & UI

// -- Global State --
    // GLOBAL STATE MANAGEMENT VARIABLES
    // ==========================================
    let currentUser = null;
    let userData = null;
    let allSessions = [];
    let currentSession = null;
    let chatHistory = [];
    
    // Quickstart state variables
    let dashSelectedSkill = "";
    let dashDifficulty = "Easy";
    let dashQuestionCount = 5;

    // Start practice config state variables
    let practiceSelectedSkill = "";
    let practiceDifficulty = "Easy";
    let practiceQuestionCount = 5;
    let practiceType = "MCQ";

    // ==========================================

let currentPracticeCategory = 'Programming';

// -- Bootstrap --
    window.addEventListener('DOMContentLoaded', () => {
      // Build landing marquee scrolling list
      populateMarqueeTicker();
      
      // Initialize dot background animation
      initLandingParticles();
      
      // Load local config preferences
      loadPreferencesFromLocalStorage();

      // Configure window-level error tracking
      window.onerror = function(msg, url, line) {
        console.error("Caught error silently: ", msg, "at", url, ":", line);
        return true; // suppresses alert dialogs
      };

      // Auto check active Firebase Auth session state
      if (auth) {
        auth.onAuthStateChanged(user => {
          if (user) {
            currentUser = user;
            showLoadingSpinner("Fetching profile metadata...");
            loadUserDataAndSync(user.uid);
          } else {
            currentUser = null;
            userData = null;
            allSessions = [];
            document.getElementById('app-wrapper').className = "no-sidebar";
            showView('landing');
            hideLoadingSpinner();
          }
        });
      } else {
        // Safe sandbox default if firebase is blocked
        showView('landing');
      }

      // Hotkey listener: Auto close modals on ESC
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAppModal();
        }
      });
    });

    // ==========================================

// -- Routing & UI --
    // APP ROUTING & VIEW CONTROLLER
    // ==========================================
    function showView(viewId) {
      // Hide all views
      const views = document.querySelectorAll('.view-section');
      views.forEach(view => view.style.display = 'none');

      // Unhide target view
      const target = document.getElementById(`view-${viewId}`);
      if (target) {
        if (target.classList.contains('auth-view')) {
          target.style.display = 'flex';
        } else {
          target.style.display = 'block';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Close hamburger nav drawer if open
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar) sidebar.classList.remove('open');

      // Adjust wrapper sidebar classes based on active view state
      const appWrapper = document.getElementById('app-wrapper');
      const sidebarViews = ['dashboard', 'start-practice', 'progress', 'history', 'leaderboard', 'settings'];
      
      if (currentUser && sidebarViews.includes(viewId)) {
        appWrapper.className = ""; // show sidebar layout frame
        updateSidebarMenuState(viewId);
      } else {
        appWrapper.className = "no-sidebar"; // fullscreen wrapper layout
      }
      
      // Refresh dynamic components matching specific views
      if (viewId === 'dashboard' && currentUser) {
        renderDashboardStatsAndQuickstart();
      } else if (viewId === 'start-practice' && currentUser) {
        initStartPracticeView();
      } else if (viewId === 'history' && currentUser) {
        loadHistoryViewData();
      } else if (viewId === 'progress' && currentUser) {
        loadProgressViewData();
      } else if (viewId === 'leaderboard' && currentUser) {
        loadLeaderboardData();
      } else if (viewId === 'settings' && currentUser) {
        loadSettingsViewData();
      }
      
      // Refresh lucide icons rendering
      setTimeout(() => {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 50);
    }

    function navigateTo(viewId, event) {
      if (event) event.preventDefault();
      showView(viewId);
    }

    function updateSidebarMenuState(viewId) {
      const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
      menuItems.forEach(item => item.classList.remove('active'));

      const activeNav = document.getElementById(`nav-${viewId}`);
      if (activeNav) activeNav.classList.add('active');
    }

    function toggleMobileSidebar() {
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('open');
      }
    }

    // ==========================================
    // TOAST NOTIFICATIONS SYSTEM
    // ==========================================
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';
      
      let icon = 'info';
      let borderGlow = 'rgba(99, 102, 241, 0.3)';
      if (type === 'success') {
        icon = 'check-circle';
        toast.style.borderLeft = '4px solid var(--accent-primary)';
      } else if (type === 'error') {
        icon = 'alert-triangle';
        toast.style.borderLeft = '4px solid var(--error)';
      } else if (type === 'warning') {
        icon = 'alert-circle';
        toast.style.borderLeft = '4px solid var(--warning)';
      } else {
        toast.style.borderLeft = '4px solid var(--accent-secondary)';
      }

      toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${icon}"></i></div>
        <div class="toast-content">${message}</div>
        <div class="toast-close" onclick="this.parentElement.remove()"><i data-lucide="x" style="width:16px;height:16px;"></i></div>
      `;

      container.appendChild(toast);
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons({attrs: {class: 'toast-icon-svg'}});
      }

      // Animation triggers
      setTimeout(() => toast.classList.add('show'), 50);
      
      // Auto-removal timing
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    // ==========================================
    // MODAL DIALOG CONTROLLER
    // ==========================================
    function showAppModal(title, body, confirmText, onConfirmCallback) {
      const overlay = document.getElementById('app-modal');
      const titleEl = document.getElementById('modal-title-el');
      const bodyEl = document.getElementById('modal-body-el');
      const confirmBtn = document.getElementById('modal-confirm-btn');

      titleEl.innerHTML = `<i data-lucide="alert-circle" class="text-green" style="width:20px;height:20px;"></i> ${title}`;
      bodyEl.textContent = body;
      confirmBtn.textContent = confirmText;
      
      // Bind callback listener
      confirmBtn.onclick = () => {
        onConfirmCallback();
        closeAppModal();
      };

      overlay.classList.add('open');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    function closeAppModal() {
      const overlay = document.getElementById('app-modal');
      if (overlay) overlay.classList.remove('open');
    }

    // ==========================================
    // INTERMEDIARY LOADERS
    // ==========================================
    function showLoadingSpinner(text = "Please wait...") {
      const loader = document.getElementById('page-loader');
      const label = document.getElementById('page-loader-text');
      label.textContent = text;
      loader.classList.add('show');
    }

    function hideLoadingSpinner() {
      const loader = document.getElementById('page-loader');
      loader.classList.remove('show');
    }

    // ==========================================

// -- Dashboard --
    // VIEW 4 — DASHBOARD CONTROLS
    // ==========================================
    function renderDashboardStatsAndQuickstart() {
      if (!userData) return;
      
      // Header details
      const firstName = userData.name.split(' ')[0];
      document.getElementById('dashboard-welcome').textContent = `Welcome back, ${firstName} 👋`;
      document.getElementById('dashboard-streak-sub').textContent = `Ready to practice? You're on a ${userData.streak}-day streak! 🔥`;
      document.getElementById('dashboard-date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      // Stats row
      const count = allSessions.length;
      document.getElementById('stat-sessions').textContent = count;
      document.getElementById('stat-streak').textContent = userData.streak;

      let avg = 0;
      let best = 0;
      if (count > 0) {
        const total = allSessions.reduce((acc, curr) => acc + (curr.averageScore || 0), 0);
        avg = Math.round(total / count);
        best = Math.max(...allSessions.map(s => Math.max(...(s.scores || [0]))));
      }
      document.getElementById('stat-avgscore').textContent = `${avg}%`;
      document.getElementById('stat-bestscore').textContent = `${best}/10`;

      // Render Popular tags cloud
      const cloud = document.getElementById('dash-tag-cloud');
      cloud.innerHTML = '';
      const popular = ["Python", "JavaScript", "React", "SQL", "DSA", "System Design", "Node.js", "AWS", "Communication", "Leadership"];
      popular.forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        if (dashSelectedSkill === skill) chip.classList.add('active');
        chip.textContent = skill;
        chip.onclick = () => selectDashboardTag(skill, chip);
        cloud.appendChild(chip);
      });

      // Render Recent Sessions
      const sessionsBox = document.getElementById('dash-recent-sessions');
      sessionsBox.innerHTML = '';
      if (allSessions.length === 0) {
        sessionsBox.innerHTML = '<div class="text-secondary" style="font-size:0.9rem; text-align:center; padding:16px;">No practice history found. Start your first session!</div>';
      } else {
        allSessions.slice(0, 5).forEach((session, idx) => {
          const row = document.createElement('div');
          row.className = 'session-row';
          
          const dt = session.date && session.date.toDate ? session.date.toDate() : new Date();
          const scorePercent = Math.round(session.averageScore || 0);

          row.innerHTML = `
            <div class="session-row-left">
              <span class="session-row-title">${session.skill}</span>
              <div class="session-row-meta">
                <span class="badge badge-secondary" style="font-size:0.6rem; padding:2px 6px;">${session.difficulty}</span>
                <span>${dt.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
              </div>
            </div>
            <div class="session-row-right">
              <span class="session-row-score ${scorePercent >= 80 ? 'text-green' : scorePercent >= 50 ? 'text-indigo' : 'text-muted'}">${scorePercent}%</span>
              <button class="btn-secondary session-row-btn" onclick="reviewPreviousSession(${idx})">Review</button>
            </div>
          `;
          sessionsBox.appendChild(row);
        });
      }

      // Render Skill progress analysis bars (Top 5 skills)
      const matrix = {};
      allSessions.forEach(s => {
        if (!matrix[s.skill]) matrix[s.skill] = [];
        matrix[s.skill].push(s.averageScore || 0);
      });

      const skillAverages = Object.keys(matrix).map(sk => {
        const avgScr = matrix[sk].reduce((a,b)=>a+b, 0) / matrix[sk].length;
        return { skill: sk, avg: Math.round(avgScr) };
      }).sort((a,b) => b.avg - a.avg).slice(0, 5);

      const breakdownBox = document.getElementById('dash-skills-breakdown-container');
      breakdownBox.innerHTML = '';
      
      if (skillAverages.length === 0) {
        breakdownBox.innerHTML = '<div class="text-secondary" style="font-size:0.9rem; text-align:center; padding:16px;">Perform interviews to build performance statistics.</div>';
      } else {
        skillAverages.forEach(skAv => {
          const bar = document.createElement('div');
          bar.className = 'skill-progress-item';
          bar.innerHTML = `
            <div class="skill-progress-header">
              <span>${skAv.skill}</span>
              <span style="font-weight:600;">${skAv.avg}%</span>
            </div>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width: ${skAv.avg}%"></div>
            </div>
          `;
          breakdownBox.appendChild(bar);
        });
      }
    }

    function selectDashboardTag(skill, chipEl) {
      document.querySelectorAll('#dash-tag-cloud .tag-chip').forEach(c => c.classList.remove('active'));
      chipEl.classList.add('active');
      dashSelectedSkill = skill;
      document.getElementById('dash-skill-input').value = skill;
    }

    function setDashDifficulty(diff) {
      const parent = document.getElementById('dash-difficulty-pills');
      parent.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === diff) btn.classList.add('active');
      });
      dashDifficulty = diff;
    }

    function setDashQuestionCount(count) {
      const parent = document.getElementById('dash-questions-pills');
      parent.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.textContent) === count) btn.classList.add('active');
      });
      dashQuestionCount = count;
    }

    function showDashSuggestions() {
      const box = document.getElementById('dash-suggestions-box');
      box.style.display = 'block';
      filterDashSkillSuggestions();
    }

    function filterDashSkillSuggestions() {
      const query = document.getElementById('dash-skill-input').value.toLowerCase();
      const box = document.getElementById('dash-suggestions-box');
      box.innerHTML = '';

      const list = ALL_SKILLS.filter(s => s.toLowerCase().includes(query)).slice(0, 8);
      list.forEach(skill => {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.textContent = skill;
        li.onclick = () => {
          document.getElementById('dash-skill-input').value = skill;
          dashSelectedSkill = skill;
          box.style.display = 'none';
          
          // Sync active state on popular tags cloud if present
          document.querySelectorAll('#dash-tag-cloud .tag-chip').forEach(chip => {
            if (chip.textContent === skill) chip.classList.add('active');
            else chip.classList.remove('active');
          });
        };
        box.appendChild(li);
      });
      if (list.length === 0) {
        box.style.display = 'none';
      }
    }

    // Hide search suggestions on document body click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-container')) {
        const dBox = document.getElementById('dash-suggestions-box');
        const pBox = document.getElementById('practice-suggestions-box');
        if (dBox) dBox.style.display = 'none';
        if (pBox) pBox.style.display = 'none';
      }
    });

    function launchDashboardQuickInterview() {
      const typed = document.getElementById('dash-skill-input').value.trim();
      if (!typed) {
        showToast("Please choose or enter a skill track.", "warning");
        return;
      }
      dashSelectedSkill = typed;
      
      // Load configurations into Start Practice variables
      practiceSelectedSkill = dashSelectedSkill;
      practiceDifficulty = dashDifficulty;
      practiceQuestionCount = dashQuestionCount;
      
      if (practiceDifficulty === 'Easy' || practiceDifficulty === 'Medium') {
        practiceType = "MCQ";
      } else {
        practiceType = "Technical";
      }
      
      // Launch trigger
      initiateInterviewSession();
    }

    // ==========================================

// -- Start Practice --
    // VIEW 5 — START PRACTICE CONTROLS
    // ==========================================
    let currentPracticeCategory = "Programming";

    function initStartPracticeView() {
      // Build Category Tab headers
      const tabsEl = document.getElementById('practice-category-tabs');
      tabsEl.innerHTML = '';
      
      Object.keys(SKILLS_BY_CATEGORY).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-tab-btn ${currentPracticeCategory === cat ? 'active' : ''}`;
        btn.textContent = cat;
        btn.onclick = () => switchPracticeCategory(cat);
        tabsEl.appendChild(btn);
      });

      renderPracticeSkillsGrid();
      updatePracticeConfigRightPanel();
    }

    function switchPracticeCategory(cat) {
      currentPracticeCategory = cat;
      initStartPracticeView();
    }

    function renderPracticeSkillsGrid() {
      const grid = document.getElementById('practice-skills-grid');
      grid.innerHTML = '';

      const list = SKILLS_BY_CATEGORY[currentPracticeCategory] || [];
      list.forEach(skill => {
        const card = document.createElement('div');
        card.className = `skill-select-card ${practiceSelectedSkill === skill ? 'active' : ''}`;
        card.innerHTML = `
          ${skill}
          <i data-lucide="check-circle" class="checkmark" style="width:14px; height:14px;"></i>
        `;
        card.onclick = () => selectPracticeSkill(skill);
        grid.appendChild(card);
      });
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function selectPracticeSkill(skill) {
      practiceSelectedSkill = skill;
      document.getElementById('practice-custom-skill-input').value = ""; // clear typed value
      initStartPracticeView();
    }

    function handleCustomPracticeSkill(val) {
      practiceSelectedSkill = val.trim();
      
      // Remove border checks from category skills grid
      document.querySelectorAll('.skill-select-card').forEach(card => card.classList.remove('active'));
      
      updatePracticeConfigRightPanel();
    }

    function showPracticeSuggestions() {
      const box = document.getElementById('practice-suggestions-box');
      box.style.display = 'block';
      filterPracticeSuggestions();
    }

    function filterPracticeSuggestions() {
      const query = document.getElementById('practice-skill-input').value.toLowerCase();
      const box = document.getElementById('practice-suggestions-box');
      box.innerHTML = '';

      const list = ALL_SKILLS.filter(s => s.toLowerCase().includes(query)).slice(0, 8);
      list.forEach(skill => {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.textContent = skill;
        li.onclick = () => {
          practiceSelectedSkill = skill;
          document.getElementById('practice-skill-input').value = "";
          box.style.display = 'none';
          
          // Switch to corresponding category view if it belongs
          for (let cat in SKILLS_BY_CATEGORY) {
            if (SKILLS_BY_CATEGORY[cat].includes(skill)) {
              currentPracticeCategory = cat;
              break;
            }
          }
          
          initStartPracticeView();
        };
        box.appendChild(li);
      });
      if (list.length === 0) {
        box.style.display = 'none';
      }
    }

    function setPracticeDifficulty(diff, cardEl) {
      document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('active'));
      cardEl.classList.add('active');
      practiceDifficulty = diff;
      
      if (diff === 'Easy' || diff === 'Medium') {
        setPracticeType('MCQ');
      } else {
        setPracticeType('Technical');
      }
    }

    function setPracticeQuestionCount(count) {
      const parent = document.getElementById('practice-question-pills');
      parent.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.textContent) === count) btn.classList.add('active');
      });
      practiceQuestionCount = count;
    }

    function setPracticeType(type) {
      const parent = document.getElementById('practice-type-pills');
      parent.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(type)) btn.classList.add('active');
      });
      practiceType = type;
    }

    function updatePracticeConfigRightPanel() {
      const wrapper = document.getElementById('practice-selected-badge-wrapper');
      const btn = document.getElementById('practice-launch-btn');

      if (practiceSelectedSkill) {
        wrapper.innerHTML = `<span class="badge badge-primary" style="font-size:0.95rem; padding:8px 16px; text-transform:none;">${practiceSelectedSkill}</span>`;
        btn.disabled = false;
      } else {
        wrapper.innerHTML = `<span class="badge badge-secondary" style="font-size:0.9rem; padding:8px 16px; text-transform:none;">No skill chosen</span>`;
        btn.disabled = true;
      }
    }

    function launchConfigurePractice() {
      initiateInterviewSession();
    }

    // ==========================================

// -- History --
    // VIEW 8 — SESSION HISTORY CONTROLS
    // ==========================================
    function loadHistoryViewData() {
      const skillFilterEl = document.getElementById('history-filter-skill');
      const activeFilterSkill = skillFilterEl.value;

      // Extract unique list of practiced skills
      const uniqueSkills = [...new Set(allSessions.map(s => s.skill))];
      skillFilterEl.innerHTML = '<option value="ALL">All Skills</option>';
      uniqueSkills.forEach(s => {
        skillFilterEl.innerHTML += `<option value="${s}" ${activeFilterSkill === s ? 'selected' : ''}>${s}</option>`;
      });

      applyHistoryFilters();
    }

    function applyHistoryFilters() {
      const skill = document.getElementById('history-filter-skill').value;
      const difficulty = document.getElementById('history-filter-difficulty').value;
      const dateRange = document.getElementById('history-filter-date').value;
      const sort = document.getElementById('history-sort').value;

      let filtered = [...allSessions];

      // Skill Filters
      if (skill !== 'ALL') {
        filtered = filtered.filter(s => s.skill === skill);
      }

      // Difficulty Filters
      if (difficulty !== 'ALL') {
        filtered = filtered.filter(s => s.difficulty === difficulty);
      }

      // Date filters
      if (dateRange !== 'ALL') {
        const now = new Date();
        filtered = filtered.filter(s => {
          const sDate = s.date && s.date.toDate ? s.date.toDate() : new Date(s.date);
          const diffTime = Math.abs(now - sDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return dateRange === 'WEEK' ? diffDays <= 7 : diffDays <= 30;
        });
      }

      // Sort
      if (sort === 'DATE_DESC') {
        // Date desc
        filtered.sort((a,b) => {
          const da = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
          const db = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
          return db - da;
        });
      } else if (sort === 'SCORE_DESC') {
        filtered.sort((a,b) => b.averageScore - a.averageScore);
      } else if (sort === 'SCORE_ASC') {
        filtered.sort((a,b) => a.averageScore - b.averageScore);
      }

      renderHistorySessionsList(filtered);
    }

    function renderHistorySessionsList(list) {
      const container = document.getElementById('history-sessions-container');
      container.innerHTML = '';

      if (list.length === 0) {
        container.innerHTML = `
          <div class="card-surface" style="padding:40px; text-align:center;">
            <p class="text-secondary" style="font-size:0.95rem; margin-bottom:16px;">No matching practice sessions found.</p>
            <button class="btn-primary" onclick="showView('start-practice')">Launch First Session →</button>
          </div>
        `;
        return;
      }

      list.forEach((session, idx) => {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        
        const dt = session.date && session.date.toDate ? session.date.toDate() : new Date(session.date);
        const timeFormatted = dt.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        let answersAccordionContent = '';
        (session.answers || []).forEach((ans, qIdx) => {
          answersAccordionContent += `
            <div style="margin-bottom:20px; border-bottom:1px solid var(--border-default); padding-bottom:16px;">
              <p style="font-weight:700; font-size:0.9rem; margin-bottom:6px;">Q${qIdx + 1}: ${ans.question}</p>
              <div class="mock-answer" style="background:#050505; color:var(--text-primary); margin-bottom:12px;">${escapeHtml(ans.answerText)}</div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;"><strong>Score:</strong> ${ans.score}/10 (${ans.verdict})</p>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;"><strong>Model Answer:</strong> ${escapeHtml(ans.modelAnswer)}</p>
            </div>
          `;
        });

        item.innerHTML = `
          <div class="accordion-header" onclick="toggleAccordion(this)">
            <span class="accordion-title">
              <span class="badge ${session.averageScore >= 80 ? 'badge-success' : session.averageScore >= 50 ? 'badge-warning' : 'badge-danger'}" style="font-size:0.8rem; padding:4px 8px;">${session.averageScore}%</span>
              <strong>${session.skill}</strong> 
              <span class="text-muted" style="font-size:0.8rem;">| ${session.difficulty} | ${timeFormatted}</span>
            </span>
            <i data-lucide="chevron-down" class="accordion-icon"></i>
          </div>
          <div class="accordion-content">
            <div style="display:flex; justify-content:space-between; margin-bottom:20px; border-bottom:1px dashed var(--border-default); padding-bottom:12px; font-size:0.85rem; color:var(--text-secondary);">
              <span>Questions Answered: ${session.answeredQuestions} / ${session.totalQuestions}</span>
              <span>Time Taken: ${Math.round(session.timeTaken / 60)} minutes</span>
            </div>
            ${answersAccordionContent}
          </div>
        `;
        container.appendChild(item);
      });

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function reviewPreviousSession(historyIndex) {
      // Sets local config to session review structure
      currentSession = allSessions[historyIndex];
      showView('results');
      renderFinalResultsOverview();
    }

    // ==========================================

// -- Progress --
    // VIEW 9 — MY PROGRESS RENDERS (SVG Chart)
    // ==========================================
    function loadProgressViewData() {
      // Sum aggregates
      const totalSessionsCount = allSessions.length;
      let totalQuestionsAnswered = 0;
      let practiceTimeSec = 0;
      let averageScoreOverall = 0;

      allSessions.forEach(s => {
        totalQuestionsAnswered += s.answeredQuestions || 0;
        practiceTimeSec += s.timeTaken || 0;
        averageScoreOverall += s.averageScore || 0;
      });

      const avgPerc = totalSessionsCount > 0 ? Math.round(averageScoreOverall / totalSessionsCount) : 0;
      
      document.getElementById('prog-stat-time').textContent = `${Math.round(practiceTimeSec / 60)}m`;
      document.getElementById('prog-stat-questions').textContent = totalQuestionsAnswered;
      document.getElementById('prog-stat-average').textContent = `${avgPerc}%`;

      renderScoreTrendSVGLineGraph();
      renderWeeklyActivityGridHeatmap();
      renderSkillBreakdownPerformanceTable();
      renderAIProgressInsightsList(avgPerc);
    }

    function renderScoreTrendSVGLineGraph() {
      const container = document.getElementById('progress-trend-container-el');
      container.innerHTML = '';

      if (allSessions.length === 0) {
        container.innerHTML = '<div class="text-secondary" style="text-align:center; padding:40px;">Complete session interviews to plot trend graphs.</div>';
        return;
      }

      // Plot chronological order (oldest to newest)
      const dataPoints = [...allSessions].reverse().slice(-20);
      
      const width = container.clientWidth || 800;
      const height = 200;
      const padding = 30;

      const chartW = width - (padding * 2);
      const chartH = height - (padding * 2);

      let polyPoints = '';
      let dotsHtml = '';
      
      dataPoints.forEach((s, idx) => {
        const x = padding + (idx * (chartW / Math.max(dataPoints.length - 1, 1)));
        const y = padding + chartH - ((s.averageScore / 100) * chartH);
        
        polyPoints += `${x},${y} `;
        dotsHtml += `
          <circle cx="${x}" cy="${y}" r="4" fill="var(--accent-primary)" stroke="#000" stroke-width="2" />
          <text x="${x}" y="${y - 10}" fill="var(--text-secondary)" font-size="8" font-family="Space Grotesk" text-anchor="middle">${s.averageScore}%</text>
        `;
      });

      const svgHtml = `
        <svg width="100%" height="${height}">
          <!-- Grid lines -->
          <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="#1f1f1f" stroke-width="1" />
          <line x1="${padding}" y1="${padding + (chartH/2)}" x2="${width - padding}" y2="${padding + (chartH/2)}" stroke="#1f1f1f" stroke-dasharray="4" />
          <line x1="${padding}" y1="${padding + chartH}" x2="${width - padding}" y2="${padding + chartH}" stroke="#1f1f1f" stroke-width="1" />
          
          <!-- Axis labels -->
          <text x="${padding - 8}" y="${padding + 4}" fill="var(--text-muted)" font-size="9" text-anchor="end">100</text>
          <text x="${padding - 8}" y="${padding + (chartH/2) + 4}" fill="var(--text-muted)" font-size="9" text-anchor="end">50</text>
          <text x="${padding - 8}" y="${padding + chartH + 4}" fill="var(--text-muted)" font-size="9" text-anchor="end">0</text>

          <!-- Polyline Trend -->
          <polyline fill="none" stroke="var(--accent-secondary)" stroke-width="3" points="${polyPoints.trim()}" />
          ${dotsHtml}
        </svg>
      `;

      container.innerHTML = svgHtml;
    }

    function renderWeeklyActivityGridHeatmap() {
      const grid = document.getElementById('progress-heatmap-grid-el');
      grid.innerHTML = '';

      // Array of past 7 days
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        days.push(d);
      }

      days.forEach(day => {
        const dayStr = day.toISOString().split('T')[0];
        const daySessions = allSessions.filter(s => {
          const sDateStr = s.date && s.date.toDate ? s.date.toDate().toISOString().split('T')[0] : new Date(s.date).toISOString().split('T')[0];
          return sDateStr === dayStr;
        });

        const card = document.createElement('div');
        card.className = 'heatmap-day';
        
        let label = day.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (daySessions.length > 1) {
          card.classList.add('active-bright');
        } else if (daySessions.length === 1) {
          card.classList.add('active-light');
        }

        card.innerHTML = `
          <span style="font-size:0.9rem; font-weight:700; color:#000;">${daySessions.length}</span>
          <span class="heatmap-day-label">${label}</span>
        `;
        grid.appendChild(card);
      });
    }

    function renderSkillBreakdownPerformanceTable() {
      const body = document.getElementById('progress-skills-table-body');
      body.innerHTML = '';

      const matrix = {};
      allSessions.forEach(s => {
        if (!matrix[s.skill]) matrix[s.skill] = [];
        matrix[s.skill].push(s);
      });

      const skillNames = Object.keys(matrix);
      if (skillNames.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No records found. Run mock interviews to populate statistics.</td></tr>';
        return;
      }

      skillNames.forEach(skill => {
        const list = matrix[skill];
        const times = list.length;
        const best = Math.max(...list.map(s => s.averageScore));
        const avg = Math.round(list.reduce((acc, curr) => acc + curr.averageScore, 0) / times);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${skill}</strong></td>
          <td>${times} sessions</td>
          <td class="text-green">${best}%</td>
          <td style="font-weight:600;">${avg}%</td>
          <td>
            <div class="skill-progress-bar" style="max-width:180px;">
              <div class="skill-progress-fill" style="width: ${avg}%; background: var(--accent-secondary);"></div>
            </div>
          </td>
        `;
        body.appendChild(row);
      });
    }

    function renderAIProgressInsightsList(avgPercent) {
      const listEl = document.getElementById('progress-insights-list');
      listEl.innerHTML = '';

      if (allSessions.length === 0) {
        listEl.innerHTML = '<li>Start practicing to unlock performance feedback.</li>';
        return;
      }

      // Generate static programmatic rule insights
      const pySessions = allSessions.filter(s => s.skill.toLowerCase().includes('python'));
      if (pySessions.length >= 2) {
        listEl.innerHTML += `<li>📈 You've completed ${pySessions.length} Python tracks. Continue practicing algorithm application challenges.</li>`;
      }
      
      if (avgPercent >= 80) {
        listEl.innerHTML += `<li>🏆 Excellent work! Your average score is ${avgPercent}%. Consider scaling up difficulty selections.</li>`;
      } else if (avgPercent >= 60) {
        listEl.innerHTML += `<li>🎯 Steady progress. Work on adding specific code syntaxes and code examples in explanation blocks.</li>`;
      } else {
        listEl.innerHTML += `<li>💡 Focus on structural foundations. Review and study the Model Answers in Results screen carefully.</li>`;
      }

      // Streak comment
      if (userData && userData.streak >= 3) {
        listEl.innerHTML += `<li>🔥 Active Prep! You have maintained a ${userData.streak} day streak. Keep the momentum going!</li>`;
      }
    }

    // ==========================================

// -- Leaderboard --
    // VIEW 10 — LEADERBOARD RENDERING
    // ==========================================
    async function loadLeaderboardData() {
      const body = document.getElementById('leaderboard-table-body');
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">Loading rankings...</td></tr>';
      
      try {
        if (!db) throw new Error("Firestore offline.");

        const snapshot = await db.collection('users').orderBy('totalSessions', 'desc').limit(20).get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        body.innerHTML = '';
        users.forEach((user, index) => {
          const row = document.createElement('tr');
          
          if (currentUser && user.id === currentUser.uid) {
            row.className = 'leaderboard-row-highlight';
          }

          const initialsName = formatUserLeaderboardName(user.name);
          const avgScore = user.totalSessions > 0 ? Math.round(user.totalScore / user.totalSessions) : 0;

          row.innerHTML = `
            <td>#${index + 1}</td>
            <td><strong>${initialsName}</strong></td>
            <td>${user.stream || 'General'}</td>
            <td>${user.totalSessions || 0} sessions</td>
            <td style="font-weight:600;">${avgScore}%</td>
          `;
          body.appendChild(row);
        });

        // Current user rank status
        if (currentUser) {
          const userIdx = users.findIndex(u => u.id === currentUser.uid);
          const statusEl = document.getElementById('leaderboard-user-rank-status');
          
          if (userIdx !== -1) {
            statusEl.innerHTML = `You are currently ranked <span class="text-green">#${userIdx + 1}</span> out of top candidates.`;
          } else {
            statusEl.innerHTML = `Complete sessions to climb onto the global ranking leaderboard.`;
          }
        }
      } catch (err) {
        console.warn("Could not query leaderboard. Loading sandbox fallback mock metrics.", err);
        // Sandboxed Mock Rankings
        const mocks = [
          { name: "John Doe", stream: "Computer Science", totalSessions: 42, totalScore: 3400 },
          { name: "Madiha", stream: "Data Science", totalSessions: 38, totalScore: 3250 },
          { name: "Sarah K.", stream: "MBA", totalSessions: 31, totalScore: 2600 },
          { name: "Alex Mercer", stream: "Design", totalSessions: 18, totalScore: 1400 },
          { name: "You (Candidate)", stream: userData ? userData.stream : "Computer Science", totalSessions: userData ? userData.totalSessions : 0, totalScore: userData ? userData.totalScore : 0, isSelf: true }
        ];

        // Sort
        mocks.sort((a,b) => b.totalSessions - a.totalSessions);

        body.innerHTML = '';
        mocks.forEach((user, index) => {
          const row = document.createElement('tr');
          if (user.isSelf) row.className = 'leaderboard-row-highlight';

          const avgScore = user.totalSessions > 0 ? Math.round(user.totalScore / user.totalSessions) : 0;
          row.innerHTML = `
            <td>#${index + 1}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.stream}</td>
            <td>${user.totalSessions} sessions</td>
            <td>${avgScore}%</td>
          `;
          body.appendChild(row);
        });

        document.getElementById('leaderboard-user-rank-status').innerHTML = "Sandbox Mode. Local dashboard rankings are mocked.";
      }
    }

    function formatUserLeaderboardName(name) {
      if (!name) return "Anonymous";
      const parts = name.split(' ');
      if (parts.length > 1) {
        return `${parts[0]} ${parts[1][0]}.`;
      }
      return name;
    }

    // ==========================================

// -- Settings --
    // VIEW 11 — SETTINGS CONTROLS & DANGER ZONE
    // ==========================================
    function loadSettingsViewData() {
      if (!userData) return;
      
      document.getElementById('settings-name').value = userData.name;
      document.getElementById('settings-email').value = userData.email;
      document.getElementById('settings-stream').value = userData.stream;
    }

    async function saveProfileSettings(event) {
      event.preventDefault();
      
      const newName = document.getElementById('settings-name').value.trim();
      const newStream = document.getElementById('settings-stream').value;

      showLoadingSpinner("Saving changes...");

      try {
        if (!db || !currentUser) throw new Error("Database reference missing.");

        await db.collection('users').doc(currentUser.uid).update({
          name: newName,
          stream: newStream
        });

        await currentUser.updateProfile({ displayName: newName });
        
        // Sync structures
        loadUserDataAndSync(currentUser.uid);
      } catch (err) {
        console.warn("Local storage fallback save.", err);
        if (userData) {
          userData.name = newName;
          userData.stream = newStream;
        }
        updateSidebarUserProfileUI();
        showToast("Profile updated locally.", "success");
        hideLoadingSpinner();
      }
    }

    async function saveSecuritySettings(event) {
      event.preventDefault();

      const currPass = document.getElementById('settings-currpass').value;
      const newPass = document.getElementById('settings-newpass').value;
      const confPass = document.getElementById('settings-confpass').value;

      if (newPass.length < 6) {
        showToast("New password must be at least 6 characters.", "warning");
        return;
      }

      if (newPass !== confPass) {
        showToast("New passwords do not match.", "warning");
        return;
      }

      showLoadingSpinner("Re-authenticating...");

      try {
        if (!auth || !currentUser) throw new Error("Auth system offline.");

        // Reauthenticate
        const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currPass);
        await currentUser.reauthenticateWithCredential(credential);
        
        await currentUser.updatePassword(newPass);
        
        // Clear fields
        document.getElementById('settings-currpass').value = '';
        document.getElementById('settings-newpass').value = '';
        document.getElementById('settings-confpass').value = '';
        
        showToast("Password updated successfully!", "success");
      } catch (err) {
        console.error(err);
        showToast(err.message || "Failed to update password. Verify credentials.", "error");
      } finally {
        hideLoadingSpinner();
      }
    }

    function savePreferences() {
      const hints = document.getElementById('pref-hints').checked;
      const autosave = document.getElementById('pref-autosave').checked;
      const offline = document.getElementById('pref-offline').checked;

      const prefs = { hints, autosave, offline };
      localStorage.setItem('prepai_preferences', JSON.stringify(prefs));
      showToast("Preferences auto-saved.", "success");
    }

    function loadPreferencesFromLocalStorage() {
      const local = localStorage.getItem('prepai_preferences');
      if (local) {
        try {
          const prefs = JSON.parse(local);
          document.getElementById('pref-hints').checked = !!prefs.hints;
          document.getElementById('pref-autosave').checked = !!prefs.autosave;
          document.getElementById('pref-offline').checked = !!prefs.offline;
        } catch(e) {
          console.warn("Prefs read failure.", e);
        }
      }
    }

    function triggerDeleteAccountModal() {
      showAppModal(
        "Permanently Delete Account?",
        "WARNING: This action is irreversible. All practice session records, logs, and account authentication parameters will be permanently erased.",
        "Permanently Delete",
        executeAccountDeletion
      );
    }

    async function executeAccountDeletion() {
      showLoadingSpinner("Deleting database structures...");
      try {
        if (!currentUser) throw new Error("No active user signed in.");

        const uid = currentUser.uid;

        // Delete sessions history in Firestore
        if (db) {
          const snap = await db.collection('sessions').where('userId', '==', uid).get();
          const batch = db.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();

          // Delete user doc
          await db.collection('users').doc(uid).delete();
        }

        // Delete user auth parameters
        await currentUser.delete();
        showToast("Account deleted successfully.", "info");
      } catch (err) {
        console.error(err);
        showToast(err.message || "Deletion failed. Try logging in again before attempting deletion.", "error");
      } finally {
        hideLoadingSpinner();
      }
    }

    // ==========================================

// -- Particles & Ticker --
    // LANDING DYNAMIC CANVAS PARTICLES SYSTEM
    // ==========================================
    function initLandingParticles() {
      const canvas = document.getElementById('particles-canvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let animationFrameId;

      function resize() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 700;
      }
      resize();
      window.addEventListener('resize', resize);

      const dots = [];
      const numDots = 40;
      
      for(let i=0; i<numDots; i++) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1
        });
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        
        dots.forEach(dot => {
          dot.x += dot.vx;
          dot.y += dot.vy;

          if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
          if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        animationFrameId = requestAnimationFrame(animate);
      }
      animate();

      // Clean up anims when landing is unmounted
      const observer = new MutationObserver((mutations) => {
        const landing = document.getElementById('view-landing');
        if (landing && landing.style.display === 'none') {
          cancelAnimationFrame(animationFrameId);
        }
      });
      observer.observe(document.getElementById('view-landing'), { attributes: true, attributeFilter: ['style'] });
    }

    function populateMarqueeTicker() {
      const track = document.getElementById('ticker-track-el');
      if (!track) return;

      const skills = [...ALL_SKILLS, ...ALL_SKILLS]; // Duplicate to loop
      track.innerHTML = '';
      skills.forEach(sk => {
        const div = document.createElement('div');
        div.className = 'ticker-item';
        div.textContent = sk;
        track.appendChild(div);
      });
    }

    // ==========================================
