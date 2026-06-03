// simulator.js — Interview Engine & AI Logic

    // VIEW 6 — INTERVIEW SIMULATOR CORE
    // ==========================================
    let interviewQuestions = [];
    let currentQuestionIndex = 0;
    let interviewTimerInterval = null;
    let secondsElapsedThisQuestion = 0;
    let interviewAnswersCollected = [];
    let isEvaluationPending = false;

    async function initiateInterviewSession() {
      // Enforce rules: Easy & Medium -> MCQ, Hard -> Technical
      if (practiceDifficulty === 'Easy' || practiceDifficulty === 'Medium') {
        practiceType = 'MCQ';
      } else {
        practiceType = 'Technical';
      }

      showLoadingSpinner(`🤖 Generating your personalized questions for ${practiceSelectedSkill}...`);
      
      let prompt = "";
      if (practiceType === 'MCQ') {
        prompt = `You are an expert technical interviewer. Generate exactly ${practiceQuestionCount} Multiple Choice Questions (MCQs) for a candidate preparing for ${practiceSelectedSkill} interviews at ${practiceDifficulty} level.
Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.
Format:
[
  {
    "id": 1,
    "question": "the question text",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0, // 0-indexed index of correct option (0, 1, 2, or 3)
    "hint": "a helpful hint",
    "explanation": "Detailed explanation of why this option is correct.",
    "category": "conceptual/application/problem-solving"
  }
]
`;
      } else {
        prompt = `You are an expert technical interviewer. Generate exactly ${practiceQuestionCount} interview questions for a candidate preparing for ${practiceSelectedSkill} interviews at ${practiceDifficulty} level. Interview type: ${practiceType}.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.

Format:
[
  {
    "id": 1,
    "question": "the question text",
    "hint": "a helpful hint without giving away the answer",
    "category": "concept/application/problem-solving",
    "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
  }
]

Questions should be realistic interview questions that companies actually ask. Vary the question types.`;
      }

      let success = false;
      try {
        const result = await fetchGeminiContent(prompt);
        interviewQuestions = cleanAndParseJSON(result);
        
        if (!Array.isArray(interviewQuestions) || interviewQuestions.length === 0) {
          throw new Error("Invalid or empty question structure fetched.");
        }
        success = true;
      } catch (err) {
        console.warn("Gemini failed question generation (first attempt):", err);
        // Stricter format retry logic
        try {
          const strictPrompt = prompt + " STRICT COMPLIANCE REQUIRED: Output must strictly validate under JSON.parse().";
          const retryResult = await fetchGeminiContent(strictPrompt);
          interviewQuestions = cleanAndParseJSON(retryResult);
          
          if (!Array.isArray(interviewQuestions) || interviewQuestions.length === 0) {
            throw new Error("Invalid or empty question structure fetched on retry.");
          }
          success = true;
        } catch(retryErr) {
          console.error("Gemini failed question generation (retry attempt):", retryErr);
          
          // Fall back gracefully to high-fidelity mock questions
          showToast("Gemini API connection issue. Running mock sandbox interview session.", "warning");
          try {
            const mockResult = getMockGeminiResponse(prompt);
            interviewQuestions = cleanAndParseJSON(mockResult);
            success = true;
          } catch (mockErr) {
            console.error("Mock fallback failed:", mockErr);
          }
        }
      }

      if (success && Array.isArray(interviewQuestions) && interviewQuestions.length > 0) {
        currentQuestionIndex = 0;
        interviewAnswersCollected = [];
        chatHistory = [];
        
        currentSession = {
          skill: practiceSelectedSkill,
          difficulty: practiceDifficulty,
          totalQuestions: interviewQuestions.length,
          type: practiceType,
          questions: interviewQuestions,
          answers: [],
          timeTaken: 0
        };

        hideLoadingSpinner();
        showView('interview');
        loadInterviewQuestionDetails();
      } else {
        hideLoadingSpinner();
        showToast("Could not generate interview questions. Please try again.", "error");
      }
    }

    function loadInterviewQuestionDetails() {
      isEvaluationPending = false;
      const question = interviewQuestions[currentQuestionIndex];
      
      // UI element adjustments
      document.getElementById('interview-skill-title').textContent = currentSession.skill;
      document.getElementById('interview-difficulty-badge').textContent = currentSession.difficulty;
      document.getElementById('interview-q-progress').textContent = `Question ${currentQuestionIndex + 1} of ${currentSession.totalQuestions}`;
      
      const percentage = ((currentQuestionIndex) / currentSession.totalQuestions) * 100;
      document.getElementById('interview-progress-bar-fill').style.width = `${percentage}%`;
      
      document.getElementById('interview-question-index').textContent = `Q${currentQuestionIndex + 1}`;
      document.getElementById('interview-question-category').textContent = (question.category || "CONCEPTUAL").toUpperCase();
      document.getElementById('interview-question-text').textContent = question.question;
      
      // Hide hints & evaluations
      document.getElementById('interview-hint-box').style.display = 'none';
      document.getElementById('interview-eval-card').style.display = 'none';
      
      // Enable textareas and clear entries / Render MCQ options
      if (practiceType === 'MCQ') {
        document.getElementById('interview-answer-textarea').style.display = 'none';
        document.getElementById('interview-char-count').style.display = 'none';
        
        const mcqContainer = document.getElementById('interview-mcq-options-container');
        mcqContainer.style.display = 'flex';
        mcqContainer.innerHTML = '';
        
        let options = question.options || [];
        if (options.length === 0) {
          options = ["Option A", "Option B", "Option C", "Option D"];
        }
        
        options.forEach((opt, idx) => {
          const optLetter = ["A", "B", "C", "D"][idx] || String.fromCharCode(65 + idx);
          const btn = document.createElement('button');
          btn.className = 'mcq-option-btn';
          btn.innerHTML = `<span class="mcq-option-badge">${optLetter}</span><span class="mcq-option-text">${escapeHtml(opt)}</span>`;
          btn.onclick = () => {
            if (document.getElementById('interview-eval-card').style.display === 'block') return; // disabled if already submitted
            document.querySelectorAll('.mcq-option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            mcqContainer.dataset.selectedIdx = idx;
            document.getElementById('btn-submit-answer').disabled = false;
          };
          mcqContainer.appendChild(btn);
        });
        
        mcqContainer.dataset.selectedIdx = "";
        document.getElementById('btn-submit-answer').disabled = true;
      } else {
        const textEl = document.getElementById('interview-answer-textarea');
        textEl.style.display = 'block';
        textEl.value = "";
        textEl.disabled = false;
        textEl.style.height = 'auto';
        document.getElementById('interview-char-count').style.display = 'block';
        updateCharCount("");
        document.getElementById('interview-mcq-options-container').style.display = 'none';
      }

      // Re-enable actions buttons
      document.getElementById('btn-submit-answer').style.display = 'inline-flex';
      document.getElementById('btn-submit-answer').disabled = false;
      document.getElementById('btn-submit-answer').textContent = "Submit Answer ✅";

      // Reset chat companion logs
      const msgBox = document.getElementById('chat-messages-container');
      msgBox.innerHTML = `
        <div class="chat-msg chat-msg-bot">
          Hello! I am your companion bot helper. I have context regarding the current question: "${question.question}". Ask me anything!
        </div>
      `;

      // Start elapsed timer triggers
      secondsElapsedThisQuestion = 0;
      updateTimerDisplay();
      clearInterval(interviewTimerInterval);
      interviewTimerInterval = setInterval(() => {
        secondsElapsedThisQuestion++;
        currentSession.timeTaken++;
        updateTimerDisplay();
      }, 1000);
      
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function updateTimerDisplay() {
      const minutes = Math.floor(secondsElapsedThisQuestion / 60).toString().padStart(2, '0');
      const seconds = (secondsElapsedThisQuestion % 60).toString().padStart(2, '0');
      document.getElementById('interview-timer').textContent = `${minutes}:${seconds}`;
    }

    function updateCharCount(val) {
      document.getElementById('interview-char-count').textContent = `${val.length} characters`;
    }

    function toggleInterviewHint() {
      const box = document.getElementById('interview-hint-box');
      const q = interviewQuestions[currentQuestionIndex];
      box.textContent = q.hint || "Try listing down definitions, then step through application rules.";
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }

    async function triggerExplainQuestion() {
      const q = interviewQuestions[currentQuestionIndex];
      showLoadingSpinner("🤖 Synthesizing simple explanations...");
      
      const prompt = `Explain this interview question simply. Breakdown complex terminologies, explain the core concept, and outline how the candidate should tackle answering it.
Question: "${q.question}"`;

      try {
        const text = await fetchGeminiContent(prompt);
        hideLoadingSpinner();
        
        // Show explanation as bot chat assistant bubble
        appendChatBubble(text, 'bot');
        showToast("Explanation loaded in assistant sidebar.", "info");
      } catch (err) {
        hideLoadingSpinner();
        showToast("Could not retrieve explanations.", "error");
      }
    }

    async function submitInterviewAnswer() {
      const q = interviewQuestions[currentQuestionIndex];

      if (practiceType === 'MCQ') {
        const mcqContainer = document.getElementById('interview-mcq-options-container');
        const selectedIdx = parseInt(mcqContainer.dataset.selectedIdx);
        if (isNaN(selectedIdx) || selectedIdx === null || selectedIdx === undefined) {
          showToast("Please choose an option to submit.", "warning");
          return;
        }

        clearInterval(interviewTimerInterval);
        const submitBtn = document.getElementById('btn-submit-answer');
        submitBtn.disabled = true;

        const isCorrect = (selectedIdx === q.correctAnswer);

        // Highlight options in UI
        const buttons = mcqContainer.querySelectorAll('.mcq-option-btn');
        buttons.forEach((btn, idx) => {
          btn.disabled = true;
          if (idx === q.correctAnswer) {
            btn.classList.add('correct');
          } else if (idx === selectedIdx && !isCorrect) {
            btn.classList.add('incorrect');
          }
        });

        const selectedLetter = ["A", "B", "C", "D"][selectedIdx] || String(selectedIdx);
        const correctLetter = ["A", "B", "C", "D"][q.correctAnswer] || String(q.correctAnswer);

        const feedback = {
          score: isCorrect ? 10 : 0,
          verdict: isCorrect ? "Excellent" : "Poor",
          strengths: isCorrect 
            ? ["Selected the correct option directly.", "Demonstrated precise conceptual understanding."] 
            : ["Attempted the multiple-choice question."],
          improvements: isCorrect 
            ? ["No critical concept improvements required."] 
            : [`Incorrect option selected (${selectedLetter}). Correct choice is ${correctLetter}.`, `Explanation: ${q.explanation || 'See explanation for details.'}`],
          modelAnswer: `Correct Answer: Option ${correctLetter}) ${q.options[q.correctAnswer] || ''}\n\nExplanation: ${q.explanation || 'No detailed explanation provided.'}`,
          tip: isCorrect 
            ? "Excellent! Keep testing your recall speed." 
            : "Review this specific terminology. Make a flashcard for future retention."
        };

        isEvaluationPending = true;
        renderQuestionEvaluation(feedback, `Option ${selectedLetter}: ${q.options[selectedIdx]}`, false);
        submitBtn.style.display = 'none';
        return;
      }

      const ansText = document.getElementById('interview-answer-textarea').value.trim();
      if (!ansText) {
        showToast("Please enter an answer to evaluate, or click Skip.", "warning");
        return;
      }

      // Freeze typing inputs
      document.getElementById('interview-answer-textarea').disabled = true;
      
      const submitBtn = document.getElementById('btn-submit-answer');
      submitBtn.disabled = true;
      submitBtn.textContent = "AI Evaluator loading...";

      clearInterval(interviewTimerInterval);
      
      const evalPrompt = `You are evaluating an interview answer. 
Question: "${q.question}"
Skill: ${currentSession.skill}, Difficulty: ${currentSession.difficulty}
Candidate's Answer: "${ansText}"
Expected Key Points: ${JSON.stringify(q.expectedKeyPoints || [])}

Return ONLY valid JSON, no markdown, no backticks:
{
  "score": <number 1-10>,
  "verdict": "Excellent|Good|Average|Poor",
  "strengths": ["what was good point 1", "what was good point 2"],
  "improvements": ["what to improve 1", "what to improve 2"],
  "modelAnswer": "A comprehensive model answer for this question",
  "tip": "One specific actionable tip for next time"
}`;

      try {
        const response = await fetchGeminiContent(evalPrompt);
        const feedback = cleanAndParseJSON(response);
        
        isEvaluationPending = true;
        renderQuestionEvaluation(feedback, ansText, false);
      } catch (err) {
        console.error("Evaluation response parse collapsed:", err);
        // Clean retry
        try {
          const retryPrompt = evalPrompt + " ONLY raw JSON response allowed.";
          const retryResp = await fetchGeminiContent(retryPrompt);
          const feedback = cleanAndParseJSON(retryResp);
          
          isEvaluationPending = true;
          renderQuestionEvaluation(feedback, ansText, false);
        } catch(retryErr) {
          showToast("AI Evaluator timed out. Answer saved but score marked as average.", "error");
          
          const fallbackFeedback = {
            score: 5,
            verdict: "Average",
            strengths: ["Submitted response for evaluation."],
            improvements: ["AI evaluations timed out. Manual review suggested."],
            modelAnswer: "Contact platform admin or retry prompt configurations.",
            tip: "Keep detailed notes when AI fails queries."
          };
          isEvaluationPending = true;
          renderQuestionEvaluation(fallbackFeedback, ansText, false);
        }
      } finally {
        submitBtn.style.display = 'none';
      }
    }

    function skipInterviewQuestion() {
      clearInterval(interviewTimerInterval);
      const q = interviewQuestions[currentQuestionIndex];

      if (practiceType === 'MCQ') {
        const mcqContainer = document.getElementById('interview-mcq-options-container');
        const buttons = mcqContainer.querySelectorAll('.mcq-option-btn');
        buttons.forEach((btn, idx) => {
          btn.disabled = true;
          if (idx === q.correctAnswer) {
            btn.classList.add('correct');
          }
        });

        const correctLetter = ["A", "B", "C", "D"][q.correctAnswer] || String(q.correctAnswer);

        const feedback = {
          score: 0,
          verdict: "Poor",
          strengths: ["No answer provided."],
          improvements: ["Question skipped by user.", `Correct choice was Option ${correctLetter}.`],
          modelAnswer: `Correct Answer: Option ${correctLetter}) ${q.options[q.correctAnswer] || ''}\n\nExplanation: ${q.explanation || 'No detailed explanation provided.'}`,
          tip: "Try guessing even if you are unsure of the answer."
        };

        document.getElementById('btn-submit-answer').style.display = 'none';
        renderQuestionEvaluation(feedback, "[Skipped]", true);
        return;
      }

      const fallbackFeedback = {
        score: 0,
        verdict: "Poor",
        strengths: ["No answer provided."],
        improvements: ["Question skipped by user."],
        modelAnswer: "Skipped question has no evaluations.",
        tip: "Avoid skipping questions in active sessions."
      };
      
      document.getElementById('interview-answer-textarea').value = "[Skipped]";
      document.getElementById('interview-answer-textarea').disabled = true;
      document.getElementById('btn-submit-answer').style.display = 'none';
      
      renderQuestionEvaluation(fallbackFeedback, "[Skipped]", true);
    }

    function renderQuestionEvaluation(feedback, originalAnswer, skipped = false) {
      const score = feedback.score || 0;
      const verdict = feedback.verdict || "Unscored";
      
      // Style badge according to score
      const badge = document.getElementById('eval-score-badge-label');
      badge.textContent = score;
      badge.className = "eval-score-badge";
      
      if (score >= 9) badge.classList.add('badge-success');
      else if (score >= 7) badge.style.color = 'var(--accent-primary)';
      else if (score >= 5) badge.style.color = 'var(--warning)';
      else badge.classList.add('badge-danger');

      document.getElementById('eval-verdict-label').textContent = verdict;
      
      // Strengths & Improvements
      const strengthsBox = document.getElementById('eval-strengths-list');
      strengthsBox.innerHTML = '';
      (feedback.strengths || []).forEach(st => {
        strengthsBox.innerHTML += `<li><i data-lucide="check" class="text-green"></i> ${st}</li>`;
      });
      if ((feedback.strengths || []).length === 0) strengthsBox.innerHTML = '<li>None logged.</li>';

      const improvementsBox = document.getElementById('eval-improvements-list');
      improvementsBox.innerHTML = '';
      (feedback.improvements || []).forEach(imp => {
        improvementsBox.innerHTML += `<li><i data-lucide="arrow-right" class="text-indigo"></i> ${imp}</li>`;
      });
      if ((feedback.improvements || []).length === 0) improvementsBox.innerHTML = '<li>None logged.</li>';

      // Model answer box details
      document.getElementById('eval-model-answer-box').style.display = 'none';
      document.getElementById('model-ans-indicator').textContent = "(Click to Expand)";
      document.getElementById('eval-model-answer-box').textContent = feedback.modelAnswer || "";

      // Action tips
      document.getElementById('eval-tip-box-el').innerHTML = `<strong>Action Tip:</strong> ${feedback.tip || 'Review concepts daily.'}`;

      // Save question statistics
      const q = interviewQuestions[currentQuestionIndex];
      interviewAnswersCollected.push({
        questionId: q.id,
        question: q.question,
        answerText: originalAnswer,
        score: score,
        verdict: verdict,
        strengths: feedback.strengths || [],
        improvements: feedback.improvements || [],
        modelAnswer: feedback.modelAnswer || "",
        tip: feedback.tip || "",
        skipped: skipped
      });

      // Show evaluation card
      document.getElementById('interview-eval-card').style.display = 'block';
      
      // Adjust "Next Button" text for final page
      const nextBtn = document.getElementById('btn-next-question');
      if (currentQuestionIndex === currentSession.totalQuestions - 1) {
        nextBtn.textContent = "Finish Interview 🏁";
      } else {
        nextBtn.textContent = "Next Question →";
      }

      setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }, 50);
    }

    function toggleModelAnswerVisibility() {
      const box = document.getElementById('eval-model-answer-box');
      const indicator = document.getElementById('model-ans-indicator');
      if (box.style.display === 'none' || !box.style.display) {
        box.style.display = 'block';
        indicator.textContent = "(Click to Collapse)";
      } else {
        box.style.display = 'none';
        indicator.textContent = "(Click to Expand)";
      }
    }

    function advanceInterviewNext() {
      if (currentQuestionIndex === currentSession.totalQuestions - 1) {
        // Wrap and build results
        currentSession.answers = interviewAnswersCollected;
        
        // Progress status updates
        showView('results');
        renderFinalResultsOverview();
      } else {
        currentQuestionIndex++;
        loadInterviewQuestionDetails();
      }
    }

    function abortInterviewSession() {
      showAppModal(
        "Abort Mock Session?", 
        "If you exit the active mock interview, your progress stats and evaluation scores for the completed questions will be discarded.",
        "Exit",
        () => {
          clearInterval(interviewTimerInterval);
          showView('dashboard');
        }
      );
    }

    // ==========================================
    // INTERVIEW CHAT COMPANION CONTROLS
    // ==========================================
    function handleChatEnter(e) {
      if (e.key === 'Enter') sendUserChatMessage();
    }

    function sendSuggestionChat(suggestion) {
      document.getElementById('chat-input-box').value = suggestion;
      sendUserChatMessage();
    }

    async function sendUserChatMessage() {
      const inputEl = document.getElementById('chat-input-box');
      const msg = inputEl.value.trim();
      if (!msg) return;

      inputEl.value = '';
      appendChatBubble(msg, 'user');

      // Call Gemini Assistant API
      const q = interviewQuestions[currentQuestionIndex];
      const prompt = `You are a helpful interview coach. The candidate is currently answering interview questions about ${currentSession.skill} at ${currentSession.difficulty} level. Current question: "${q.question}". 

The candidate asks: "${msg}"

Be helpful, educational, and encouraging. Keep responses concise (2-4 sentences). Don't give away the full answer but help them think through it.`;

      try {
        appendChatBubble("Assistant is thinking...", 'bot', true);
        const response = await fetchGeminiContent(prompt);
        removeLoadingChatBubble();
        appendChatBubble(response, 'bot');
      } catch (err) {
        removeLoadingChatBubble();
        appendChatBubble("Coach service failed to compile response. Please try again.", 'bot');
      }
    }

    function appendChatBubble(text, sender, isLoading = false) {
      const container = document.getElementById('chat-messages-container');
      const bubble = document.createElement('div');
      bubble.className = `chat-msg ${sender === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}`;
      if (isLoading) bubble.id = 'chat-bot-loading-bubble';
      bubble.textContent = text;
      
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    function removeLoadingChatBubble() {
      const bubble = document.getElementById('chat-bot-loading-bubble');
      if (bubble) bubble.remove();
    }

    // ==========================================
    // VIEW 7 — RESULTS RENDERING & STORAGE
    // ==========================================
    function renderFinalResultsOverview() {
      const totalScoreSum = currentSession.answers.reduce((a,b) => a + b.score, 0);
      const avgScore = totalScoreSum / currentSession.totalQuestions; // score out of 10
      const percentageScore = Math.round(avgScore * 10); // scale out of 100

      // Counter animation
      animateOverallScoreCounter(percentageScore);

      // Metas
      document.getElementById('result-meta-skill').textContent = currentSession.skill;
      document.getElementById('result-meta-difficulty').textContent = currentSession.difficulty;
      document.getElementById('result-meta-date').textContent = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });

      // Verdict titles
      const verdictEl = document.getElementById('result-verdict-title');
      if (percentageScore >= 80) verdictEl.textContent = "Great Performance! 🎉";
      else if (percentageScore >= 50) verdictEl.textContent = "Keep Practicing! 💪";
      else verdictEl.textContent = "More Practice Needed 🎯";

      // Render Donut
      const donutBg = document.getElementById('result-donut-chart-bg');
      donutBg.style.background = `conic-gradient(var(--accent-primary) 0% ${percentageScore}%, var(--border-default) ${percentageScore}% 100%)`;
      document.getElementById('result-donut-score').textContent = `${percentageScore}%`;

      // Render Bar Chart
      const barContainer = document.getElementById('result-bar-chart-container');
      barContainer.innerHTML = '';
      currentSession.answers.forEach((ans, idx) => {
        const heightVal = ans.score * 10;
        const col = document.createElement('div');
        col.className = 'bar-col';
        col.innerHTML = `
          <div class="bar-fill" style="height: ${heightVal}px;"></div>
          <span class="bar-label">Q${idx + 1}</span>
        `;
        barContainer.appendChild(col);
      });

      // Synthesize Strengths & Improvements overall list
      const overallStrengths = [];
      const overallImprovements = [];
      
      currentSession.answers.forEach((ans, idx) => {
        if (ans.strengths && ans.strengths.length > 0) {
          overallStrengths.push(`Q${idx + 1}: ${ans.strengths[0]}`);
        }
        if (ans.improvements && ans.improvements.length > 0) {
          overallImprovements.push(`Q${idx + 1}: ${ans.improvements[0]}`);
        }
      });

      const stList = document.getElementById('result-strengths-analysis');
      stList.innerHTML = '';
      overallStrengths.slice(0, 4).forEach(st => {
        stList.innerHTML += `<li><i data-lucide="check" class="text-green"></i> ${st}</li>`;
      });
      if (overallStrengths.length === 0) stList.innerHTML = '<li>No general strengths identified.</li>';

      const impList = document.getElementById('result-improvements-analysis');
      impList.innerHTML = '';
      overallImprovements.slice(0, 4).forEach(imp => {
        impList.innerHTML += `<li><i data-lucide="arrow-right" class="text-indigo"></i> ${imp}</li>`;
      });
      if (overallImprovements.length === 0) impList.innerHTML = '<li>No general suggestions identified.</li>';

      // Q&A Accordion review lists
      const accordion = document.getElementById('result-accordion-container');
      accordion.innerHTML = '';
      currentSession.answers.forEach((ans, idx) => {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.innerHTML = `
          <div class="accordion-header" onclick="toggleAccordion(this)">
            <span class="accordion-title">
              <span class="badge ${ans.score >= 8 ? 'badge-success' : ans.score >= 5 ? 'badge-warning' : 'badge-danger'}">${ans.score}/10</span>
              Q${idx + 1}: ${ans.question}
            </span>
            <i data-lucide="chevron-down" class="accordion-icon"></i>
          </div>
          <div class="accordion-content">
            <p style="font-weight:700; margin-bottom:8px;">Your Answer:</p>
            <div class="mock-answer" style="background:#050505; color:var(--text-primary); border-color:var(--border-default);">${escapeHtml(ans.answerText)}</div>
            
            <p style="font-weight:700; margin-bottom:8px;">AI Critique:</p>
            <div style="margin-bottom:16px;">
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;"><strong>Feedback:</strong> ${ans.verdict}</p>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;"><strong>Strengths:</strong> ${ans.strengths.join(', ')}</p>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;"><strong>Improvements:</strong> ${ans.improvements.join(', ')}</p>
            </div>

            <p style="font-weight:700; margin-bottom:8px;">Model Answer:</p>
            <div class="mock-answer" style="font-family:'DM Sans'; font-size:0.9rem;">${escapeHtml(ans.modelAnswer)}</div>
          </div>
        `;
        accordion.appendChild(item);
      });

      // Auto save sessions
      saveFinishedSessionToDatabase(percentageScore);

      setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }, 50);
    }

    function animateOverallScoreCounter(target) {
      const circleEl = document.getElementById('result-overall-score');
      let currentVal = 0;
      const interval = setInterval(() => {
        if (currentVal >= target) {
          circleEl.textContent = target;
          clearInterval(interval);
        } else {
          currentVal += 2;
          circleEl.textContent = Math.min(currentVal, target);
        }
      }, 15);
    }

    function toggleAccordion(headerEl) {
      const content = headerEl.nextElementSibling;
      const icon = headerEl.querySelector('.accordion-icon');
      const isVisible = content.style.display === 'block';

      // Hide active sibling accordion items
      content.style.display = isVisible ? 'none' : 'block';
      if (icon) {
        if (isVisible) {
          icon.style.transform = 'rotate(0deg)';
        } else {
          icon.style.transform = 'rotate(180deg)';
        }
      }
    }

    async function saveFinishedSessionToDatabase(percentageScore) {
      const sessionPayload = {
        userId: currentUser ? currentUser.uid : 'offline',
        skill: currentSession.skill,
        difficulty: currentSession.difficulty,
        totalQuestions: currentSession.totalQuestions,
        answeredQuestions: currentSession.answers.filter(a => !a.skipped).length,
        scores: currentSession.answers.map(a => a.score),
        totalScore: currentSession.answers.reduce((a,b) => a+b.score, 0),
        averageScore: percentageScore,
        timeTaken: currentSession.timeTaken,
        date: firebase.firestore.FieldValue.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
        answers: currentSession.answers
      };

      try {
        if (!db) throw new Error("Firestore offline.");
        
        // Write Session
        await db.collection('sessions').add(sessionPayload);

        // Update User Profiles Metrics
        const uid = currentUser.uid;
        await db.collection('users').doc(uid).update({
          totalSessions: firebase.firestore.FieldValue.increment(1),
          totalScore: firebase.firestore.FieldValue.increment(percentageScore)
        });

        // Trigger local refetches
        loadUserDataAndSync(uid);
      } catch (err) {
        console.warn("Database storage skipped. Initializing Offline Local Cache Backup.", err);
        const cacheKey = currentUser ? `sessions_${currentUser.uid}` : 'sessions_offline';
        
        // Load, append & write local storage cache
        const historyList = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        
        // Format Timestamp matching JS date object for offline redundancy
        sessionPayload.date = new Date().toISOString();
        historyList.unshift(sessionPayload);
        localStorage.setItem(cacheKey, JSON.stringify(historyList));
        
        // Update mock state user records
        if (userData) {
          userData.totalSessions += 1;
          userData.totalScore += percentageScore;
        }
        allSessions = historyList;
        
        showToast("Session auto-saved to local memory backup.", "success");
      }
    }

    function retryCurrentInterviewTopic() {
      // Launch identical config parameters
      practiceSelectedSkill = currentSession.skill;
      practiceDifficulty = currentSession.difficulty;
      practiceQuestionCount = currentSession.totalQuestions;
      practiceType = currentSession.type || "Technical";
      initiateInterviewSession();
    }

    // ==========================================

    // GOOGLE GEMINI MODEL GENERATIVE FETCH LOGIC
    // ==========================================
    async function fetchGeminiContent(promptText) {
      if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE" || !GEMINI_API_KEY) {
        showToast("Google Gemini API Key is missing. Using local mock responses.", "warning");
        return getMockGeminiResponse(promptText);
      }

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API Error: Status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error("No response candidates returned from Gemini.");
        }

        return data.candidates[0].content.parts[0].text;
      } catch (err) {
        console.warn("Gemini API call failed, falling back to mock sandbox:", err);
        showToast("Gemini API connection issue. Running mock sandbox interview session.", "warning");
        return getMockGeminiResponse(promptText);
      }
    }

    function cleanAndParseJSON(rawText) {
      let cleaned = rawText.trim();
      
      // Strip markdown codeblocks
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }
      
      return JSON.parse(cleaned);
    }

    // ==========================================

    // UTILS & HELPERS
    // ==========================================
    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // ==========================================
