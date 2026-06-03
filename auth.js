// auth.js — Firebase Auth & User Profile

    // PROFILE STREAK COMPARISON LOGIC
    // ==========================================
    function processUserStreakCalculation(docData) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastActiveStr = docData.lastActive || "";
      
      if (lastActiveStr === todayStr) {
        return docData.streak || 0;
      }
      
      // Calculate day difference
      const today = new Date(todayStr);
      const lastActive = new Date(lastActiveStr);
      const diffTime = Math.abs(today - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let updatedStreak = docData.streak || 0;
      if (diffDays === 1) {
        updatedStreak += 1;
      } else if (diffDays > 1) {
        updatedStreak = 1; // Streak broken, resets to 1 active day today
      }
      
      // Update streak metadata in Firestore
      if (db && currentUser) {
        db.collection('users').doc(currentUser.uid).update({
          streak: updatedStreak,
          lastActive: todayStr
        }).catch(err => console.warn("Streak sync failed. Silenced.", err));
      }
      
      return updatedStreak;
    }

    // ==========================================
    // FIREBASE AUTH & USER PROFILE CONTROL
    // ==========================================
    async function loadUserDataAndSync(uid) {
      try {
        if (!db) throw new Error("Firestore not initialized");
        
        let doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) {
          // Re-create missing user entry fallback
          const todayStr = new Date().toISOString().split('T')[0];
          const newDoc = {
            name: auth.currentUser.displayName || "Candidate User",
            email: auth.currentUser.email,
            stream: "Computer Science",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            totalSessions: 0,
            totalScore: 0,
            streak: 1,
            lastActive: todayStr
          };
          await db.collection('users').doc(uid).set(newDoc);
          doc = await db.collection('users').doc(uid).get();
        }
        
        userData = doc.data();
        userData.streak = processUserStreakCalculation(userData);
        
        // Sync history cache
        try {
          const snapshot = await db.collection('sessions').where('userId', '==', uid).orderBy('date', 'desc').get();
          allSessions = snapshot.docs.map(s => ({ id: s.id, ...s.data() }));
        } catch(e) {
          console.warn("Failed sessions query. Utilizing localStorage fallback instead.", e);
          allSessions = JSON.parse(localStorage.getItem(`sessions_${uid}`) || '[]');
        }
        
        // Hydrate UI elements
        updateSidebarUserProfileUI();
        showView('dashboard');
        showToast("Profile synced successfully!", "success");
      } catch (err) {
        console.error("Firestore sync failed. Loading mockup fallback states.", err);
        // Sandbox mock profile initialization
        userData = {
          name: auth.currentUser ? auth.currentUser.displayName || "Offline Candidate" : "Offline Candidate",
          email: auth.currentUser ? auth.currentUser.email : "candidate@prepai.local",
          stream: "Computer Science",
          totalSessions: 0,
          totalScore: 0,
          streak: 1,
          lastActive: new Date().toISOString().split('T')[0]
        };
        allSessions = JSON.parse(localStorage.getItem(`sessions_offline`) || '[]');
        
        updateSidebarUserProfileUI();
        showView('dashboard');
        showToast("Offline mode. Local data storage initialized.", "warning");
      } finally {
        hideLoadingSpinner();
      }
    }

    function updateSidebarUserProfileUI() {
      const nameEl = document.getElementById('sidebar-username');
      const streamEl = document.getElementById('sidebar-userstream');
      const avatarEl = document.getElementById('sidebar-avatar');

      if (userData) {
        nameEl.textContent = userData.name;
        streamEl.textContent = userData.stream;
        
        // Initials avatar
        const initials = userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials || "U";
      }
    }

    // ==========================================
    // AUTH VIEWS FUNCTIONALITIES
    // ==========================================
    function togglePasswordVisibility(fieldId) {
      const field = document.getElementById(fieldId);
      const icon = field.nextElementSibling;
      if (field.type === 'password') {
        field.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        field.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function handleUserRegistration(event) {
      event.preventDefault();
      
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const stream = document.getElementById('reg-stream').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      
      // Inline Validations
      let valid = true;
      if (!name) {
        document.getElementById('reg-name-error').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('reg-name-error').style.display = 'none';
      }
      
      if (!email.match(/^\S+@\S+\.\S+$/)) {
        document.getElementById('reg-email-error').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('reg-email-error').style.display = 'none';
      }

      if (!stream) {
        document.getElementById('reg-stream-error').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('reg-stream-error').style.display = 'none';
      }

      if (password.length < 6) {
        document.getElementById('reg-pass-error').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('reg-pass-error').style.display = 'none';
      }

      if (password !== confirmPassword) {
        document.getElementById('reg-confirm-password').focus();
        document.getElementById('reg-confpass-error').style.display = 'block';
        valid = false;
      } else {
        document.getElementById('reg-confpass-error').style.display = 'none';
      }

      if (!valid) return;

      const submitBtn = document.getElementById('btn-register-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = "Please wait...";

      try {
        if (!auth) throw new Error("Firebase Authentication is unavailable.");
        
        const credentials = await auth.createUserWithEmailAndPassword(email, password);
        await credentials.user.updateProfile({ displayName: name });
        
        const todayStr = new Date().toISOString().split('T')[0];
        const userPayload = {
          name,
          email,
          stream,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          totalSessions: 0,
          totalScore: 0,
          streak: 1,
          lastActive: todayStr
        };
        
        if (db) {
          await db.collection('users').doc(credentials.user.uid).set(userPayload);
        } else {
          localStorage.setItem(`profile_${credentials.user.uid}`, JSON.stringify(userPayload));
        }

        showToast("Registration successful!", "success");
      } catch (err) {
        console.error(err);
        showToast(err.message || "Registration failed.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    }

    async function handleUserLogin(event) {
      event.preventDefault();
      
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      if (!email || !password) return;

      const submitBtn = document.getElementById('btn-login-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = "Please wait...";

      try {
        if (!auth) throw new Error("Firebase Authentication is offline.");
        await auth.signInWithEmailAndPassword(email, password);
        showToast("Welcome back!", "success");
      } catch (err) {
        console.error(err);
        showToast("Invalid email or password. Please try again.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    }

    function logoutCurrentUser() {
      if (auth) {
        auth.signOut()
          .then(() => showToast("Logged out successfully.", "info"))
          .catch(err => showToast("Sign out failed.", "error"));
      } else {
        currentUser = null;
        showView('landing');
      }
    }

    async function handlePasswordReset() {
      const email = document.getElementById('login-email').value.trim();
      if (!email.match(/^\S+@\S+\.\S+$/)) {
        showToast("Please enter a valid email address first to reset.", "warning");
        return;
      }
      try {
        if (!auth) throw new Error("Firebase Auth service unavailable.");
        await auth.sendPasswordResetEmail(email);
        showToast("Password reset email sent!", "success");
      } catch (err) {
        showToast(err.message || "Failed to trigger reset email.", "error");
      }
    }

    // ==========================================
