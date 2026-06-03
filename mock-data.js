// mock-data.js — Skills Data & Offline Fallbacks

    // SKILLS DATABASE AND CONFIG DATA
    // ==========================================
    const ALL_SKILLS = [
      "Python", "Java", "JavaScript", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "TypeScript",
      "React", "Angular", "Vue.js", "Next.js", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "FastAPI",
      "HTML/CSS", "Tailwind CSS", "Bootstrap", "GraphQL", "REST API", "WebSockets",
      "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase", "SQLite", "Oracle",
      "Data Structures", "Algorithms", "DSA", "Dynamic Programming", "System Design", "OOP", "Operating Systems", "Computer Networks", "DBMS",
      "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Statistics", "Data Analysis", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn",
      "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "CI/CD", "Linux", "Git", "DevOps", "Terraform",
      "Product Management", "Agile", "Scrum", "Leadership", "Communication", "Teamwork", "Problem Solving", "Critical Thinking",
      "MBA Finance", "Marketing Strategy", "Digital Marketing", "SEO", "Business Analytics", "Entrepreneurship",
      "React Native", "Flutter", "iOS Development", "Android Development",
      "Cybersecurity", "Ethical Hacking", "Network Security", "Blockchain"
    ];

    const SKILLS_BY_CATEGORY = {
      "Programming": ["Python", "Java", "C++", "JavaScript", "Go", "Rust", "Swift", "Kotlin"],
      "Web Dev": ["React", "Angular", "Vue.js", "Node.js", "HTML/CSS", "TypeScript", "Next.js", "GraphQL"],
      "Database": ["SQL", "MySQL", "MongoDB", "PostgreSQL", "Redis", "Firebase"],
      "CS Fundamentals": ["DSA", "OOP", "Operating Systems", "Computer Networks", "DBMS", "System Design"],
      "HR & Soft Skills": ["Communication", "Leadership", "Teamwork", "Time Management", "Conflict Resolution"],
      "Data Science": ["Machine Learning", "Deep Learning", "NLP", "Statistics", "Pandas", "TensorFlow"],
      "Management": ["Product Management", "Agile", "MBA Finance", "Marketing Strategy"],
      "Cloud & DevOps": ["AWS", "Docker", "Kubernetes", "Git", "CI/CD", "Linux"]
    };

    // ==========================================
    // MOCK GEMINI RESPONSES FALLBACKS
    // ==========================================
    function getMockGeminiResponse(promptText) {
      console.warn("Google Gemini API key placeholder remains active or failed. Generating mock results.");

      // Check if prompt is a question explanation request
      if (promptText.includes('Explain this interview question simply') || promptText.includes('Breakdown complex terminologies')) {
        const skill = (currentSession && currentSession.skill) || "Software Development";
        return `Here is a simple breakdown of the question:

### Core Concept:
This question tests your understanding of core concepts in ${skill}. In production environments, it is important to handle this correctly to ensure optimal performance, thread-safety, and secure resource consumption.

### How to tackle it:
1. **Define the terms**: Start by clarifying the definition of the concept.
2. **Implementation**: Give a quick explanation of how it is used in practice.
3. **Trade-offs**: Discuss complexity, memory overhead, or alternatives.`;
      }

      // Check if prompt is an answer evaluation request
      if (promptText.includes('evaluating an interview answer') || promptText.includes('Candidate\'s Answer')) {
        return JSON.stringify({
          score: 8,
          verdict: "Good",
          strengths: ["Clear terminology usage.", "Structured explanation framework."],
          improvements: ["Expand on architectural trade-offs.", "Include a concrete production example."],
          modelAnswer: "A comprehensive answer should define the core components, mention standard libraries, and detail performance complexity.",
          tip: "Practice writing code snippets under time pressure."
        });
      }

      // Check if prompt is for the chatbot companion assistant
      if (promptText.includes('helpful interview coach') || promptText.includes('candidate asks')) {
        const msgMatch = promptText.match(/candidate asks: "([^"]+)"/i);
        const msg = msgMatch ? msgMatch[1].toLowerCase() : "";
        const skill = (currentSession && currentSession.skill) || "Software Development";

        if (msg.includes('mistake') || msg.includes('error') || msg.includes('wrong')) {
          return `Common mistakes when answering this type of question in ${skill} include:
1. Confusing it with similar concepts in the ecosystem.
2. Forgetting to mention the time/space complexity implications.
3. Not linking the explanation back to real-world application trade-offs or scalability.`;
        }

        if (msg.includes('example') || msg.includes('sample') || msg.includes('code')) {
          return `Here is an example structure to answer this:
- **Definition**: Briefly describe the term or component.
- **Example**: Mention a scenario in ${skill} where this is used.
- **Key point**: Explain the advantage (e.g. speed, memory, scaling).`;
        }

        if (msg.includes('structure') || msg.includes('format') || msg.includes('how to')) {
          return `To structure your answer:
1. **Direct Answer**: Start with a single summary sentence.
2. **Detailed Breakdown**: Explain the underlying mechanism.
3. **Practical Context**: Mention how it is applied in ${skill} projects.`;
        }

        // Generic reply
        return `That's a great question regarding this topic. When studying ${skill}, keep in mind that understanding the underlying resource lifecycle and performance trade-offs is key. Do you want me to give you a structural template, list common mistakes, or provide an example?`;
      }
      
      const MOCK_QUESTIONS_BY_SKILL = {
        "python": [
          "What is the difference between a list and a tuple in Python? When would you use one over the other?",
          "Explain Python's GIL (Global Interpreter Lock) and how it affects multi-threaded programs.",
          "How do decorators work in Python? Write a simple execution-time decorator.",
          "What is the difference between deep copy and shallow copy in Python?",
          "Explain memory management in Python, specifically reference counting and garbage collection."
        ],
        "javascript": [
          "What is a closure in JavaScript? Explain with a practical code example.",
          "Explain event delegation and event bubbling in the browser DOM.",
          "What is the difference between let, const, and var?",
          "How do Promises work, and what are the advantages of async/await over raw Promises?",
          "What is the Event Loop in JavaScript? Explain call stack, task queue, and microtask queue."
        ],
        "react": [
          "What is the Virtual DOM and how does React optimize rendering performance?",
          "Explain the React component lifecycle and hook equivalents for class methods.",
          "What is the difference between state and props in React?",
          "How does React's Context API work, and when should you use it over a state manager like Redux?",
          "What are React Hooks rules, and how does the useEffect hook track dependencies?"
        ],
        "sql": [
          "What is the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and OUTER JOIN?",
          "Explain database normalization (1NF, 2NF, 3NF) and why it is important.",
          "What are database indexes, how do they work, and what are their write performance costs?",
          "Explain ACID properties of a database transaction with examples.",
          "What is the difference between GROUP BY and WHERE clauses?"
        ],
        "dsa": [
          "Explain the difference between an Array and a Linked List. What are the time complexities for search and insert?",
          "How does Binary Search work? What is its time complexity and prerequisite conditions?",
          "What is a Hash Table and how are collisions resolved (e.g. chaining vs. open addressing)?",
          "Describe the difference between Depth First Search (DFS) and Breadth First Search (BFS) on trees.",
          "What is QuickSort? Explain its average and worst-case time complexities."
        ],
        "system design": [
          "How would you design a distributed, real-time message broadcasting platform like WhatsApp?",
          "How would you design a rate limiter for a public API endpoint?",
          "Explain horizontal scaling vs. vertical scaling and how database sharding works.",
          "What is Content Delivery Network (CDN) caching, and how does cache invalidation function?",
          "Design a URL shortening service like Bitly."
        ],
        "node.js": [
          "How does Node.js handle concurrency if JavaScript is single-threaded?",
          "What is the difference between setImmediate() and process.nextTick()?",
          "Explain stream buffers in Node.js and why they are useful for large files.",
          "How does middleware architecture work in Express.js?",
          "What is the purpose of package-lock.json in Node.js package management?"
        ],
        "aws": [
          "What is the difference between AWS EC2, ECS, and Lambda serverless computing?",
          "Explain AWS S3 storage classes and how lifecycle policies can reduce cost.",
          "What is Amazon VPC (Virtual Private Cloud) and the difference between public and private subnets?",
          "How does AWS IAM (Identity and Access Management) protect resource access policies?",
          "Explain AWS Auto Scaling and Elastic Load Balancing (ELB) synergy."
        ],
        "communication": [
          "Describe a situation where you had to explain a complex technical concept to a non-technical stakeholder.",
          "How do you handle disagreement or conflict within a project team?",
          "Tell me about a time you had to deliver critical constructive feedback to a teammate.",
          "How do you structure status updates for leadership vs. your direct peers?",
          "Describe a time when a project requirement was ambiguous and how you resolved the clarity issue."
        ],
        "leadership": [
          "How do you prioritize competing deadlines or resource conflicts across multiple projects?",
          "Describe a time you mentored a junior team member. What was your approach and outcome?",
          "How do you align a team around a shared vision or goal when there is skepticism?",
          "Tell me about a time you made a difficult decision that was unpopular with the team.",
          "How do you foster an inclusive environment that encourages creative risk-taking?"
        ]
      };

      if (promptText.includes('generate exactly') || promptText.includes('expert technical interviewer')) {
        const countMatch = promptText.match(/generate exactly (\d+)/i);
        const count = countMatch ? parseInt(countMatch[1]) : 5;
        const skill = (practiceSelectedSkill || "Software Development").trim();
        const skillKey = skill.toLowerCase();
        
        if (promptText.includes('Multiple Choice') || promptText.includes('MCQ') || practiceType === 'MCQ') {
          const MCQ_BANKS = {
            "python": [
              {
                question: "Which of the following data types in Python is mutable?",
                options: ["tuple", "list", "str", "int"],
                correctAnswer: 1,
                explanation: "Lists are mutable in Python; their contents can be modified in-place. Tuples, strings, and integers are immutable."
              },
              {
                question: "What is the primary function of Python's Global Interpreter Lock (GIL)?",
                options: [
                  "To optimize memory garbage collection processes.",
                  "To prevent multiple threads from executing Python bytecodes at once.",
                  "To compile source code into machine instructions.",
                  "To manage network socket connections dynamically."
                ],
                correctAnswer: 1,
                explanation: "The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once."
              },
              {
                question: "Which of the following returns the index of the first occurrence of an item in a list in Python?",
                options: ["list.index(item)", "list.find(item)", "list.search(item)", "list.locate(item)"],
                correctAnswer: 0,
                explanation: "The index() method returns the first index of the matching element."
              },
              {
                question: "What does the '__init__' method do in Python classes?",
                options: [
                  "Deletes an instantiated object from memory.",
                  "Serves as the constructor to initialize new objects.",
                  "Imports a modular package inside class definition.",
                  "Declares static variables inside class functions."
                ],
                correctAnswer: 1,
                explanation: "__init__ is the initializer method automatically run when a new class instance is created."
              },
              {
                question: "Which keyword is used to handle exceptions inside try blocks in Python?",
                options: ["catch", "except", "error", "handle"],
                correctAnswer: 1,
                explanation: "Python uses 'except' to catch exceptions, unlike other programming languages that use 'catch'."
              }
            ],
            "javascript": [
              {
                question: "Which keyword declares a block-scoped variable that cannot be reassigned?",
                options: ["var", "let", "const", "fixed"],
                correctAnswer: 2,
                explanation: "const declares a block-scoped variable that cannot be reassigned."
              },
              {
                question: "What does 'typeof null' return in JavaScript?",
                options: ["'null'", "'undefined'", "'object'", "'empty'"],
                correctAnswer: 2,
                explanation: "This is a long-standing bug in JavaScript where null is classified as an object."
              },
              {
                question: "Which method converts a JSON string into a JavaScript object?",
                options: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.convert()"],
                correctAnswer: 1,
                explanation: "JSON.parse() deserializes a JSON string into a JavaScript value or object."
              },
              {
                question: "What is event delegation in JavaScript?",
                options: [
                  "Assigning events to child elements individually.",
                  "Binding a single listener to a parent element to handle events on children.",
                  "Canceling event propagation across the browser DOM tree.",
                  "Creating custom events manually using Event constructors."
                ],
                correctAnswer: 1,
                explanation: "Event delegation leverages event bubbling to listen to child clicks by attaching a single listener to a parent node."
              },
              {
                question: "Which function executes a callback block repeatedly at specific time intervals?",
                options: ["setTimeout", "setInterval", "setPeriod", "loopInterval"],
                correctAnswer: 1,
                explanation: "setInterval repeatedly executes a callback function with a fixed time delay between each call."
              }
            ],
            "react": [
              {
                question: "Which Hook is used to handle side-effects in React functional components?",
                options: ["useState", "useEffect", "useReducer", "useCallback"],
                correctAnswer: 1,
                explanation: "useEffect lets functional components perform API calls, subscriptions, and other DOM changes (side-effects)."
              },
              {
                question: "What is the purpose of the 'key' prop when rendering lists in React?",
                options: [
                  "To secure the components from cross-site scripting inputs.",
                  "To help React identify which items have changed, been added, or removed.",
                  "To bind styles directly to rendered array nodes.",
                  "To inherit state values from parent rendering grids."
                ],
                correctAnswer: 1,
                explanation: "Keys help React identify items uniquely to optimize diffing and DOM node reuse."
              },
              {
                question: "Which hook retrieves context values without using context consumers?",
                options: ["useContext", "useProp", "useStore", "useConsumer"],
                correctAnswer: 0,
                explanation: "useContext accepts a context object and returns the current context value."
              },
              {
                question: "What is the Virtual DOM in React?",
                options: [
                  "A physical copy of browser native DOM nodes.",
                  "An in-memory representation of the real DOM tree used to optimize rendering updates.",
                  "A design framework that renders layouts inside HTML canvas views.",
                  "An external database system that caches HTML pages."
                ],
                correctAnswer: 1,
                explanation: "The Virtual DOM is a representation of the UI kept in memory and synced with the real DOM via reconciliation."
              },
              {
                question: "How do you define default values for props in React?",
                options: ["Component.defaultProps", "Component.props", "Component.defaults", "Component.fallbackProps"],
                correctAnswer: 0,
                explanation: "defaultProps can be defined as a property on the component class/function to set default props."
              }
            ],
            "sql": [
              {
                question: "Which SQL clause filters groups created by GROUP BY?",
                options: ["WHERE", "HAVING", "ORDER BY", "SELECT"],
                correctAnswer: 1,
                explanation: "HAVING filters groups of rows defined by the GROUP BY clause, whereas WHERE filters individual rows."
              },
              {
                question: "Which join returns all rows from the left table and matched rows from the right table?",
                options: ["INNER JOIN", "RIGHT JOIN", "LEFT JOIN", "FULL JOIN"],
                correctAnswer: 2,
                explanation: "A LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table and matched records from the right table."
              },
              {
                question: "What does the ACID transaction property 'Durability' guarantee?",
                options: [
                  "Transactions execute simultaneously without interference.",
                  "Transactions leave the database in a consistent state.",
                  "Committed transaction changes are persisted even during crash failures.",
                  "All transaction steps succeed or none do."
                ],
                correctAnswer: 2,
                explanation: "Durability ensures that once a transaction is committed, its changes survive system outages or failures."
              },
              {
                question: "Which index type is best for range queries like BETWEEN?",
                options: ["Hash Index", "B-Tree Index", "Bitmap Index", "Spatial Index"],
                correctAnswer: 1,
                explanation: "B-Tree indexes maintain sorted values, making them optimal for equality and range query filters."
              },
              {
                question: "Which keyword removes duplicate rows from SELECT outputs?",
                options: ["UNIQUE", "DISTINCT", "DIFFERENT", "SINGLE"],
                correctAnswer: 1,
                explanation: "DISTINCT is used to return only unique values from table queries."
              }
            ]
          };

          let activeMCQPool = MCQ_BANKS[skillKey];
          if (!activeMCQPool) {
            const matchedKey = Object.keys(MCQ_BANKS).find(k => skillKey.includes(k) || k.includes(skillKey));
            activeMCQPool = matchedKey ? MCQ_BANKS[matchedKey] : null;
          }

          const list = [];
          for (let i = 1; i <= count; i++) {
            let mcq = null;
            if (activeMCQPool && activeMCQPool[(i - 1) % activeMCQPool.length]) {
              mcq = activeMCQPool[(i - 1) % activeMCQPool.length];
            } else {
              mcq = {
                question: `Mock Multiple Choice Question #${i} for ${skill}: What is the primary design pattern recommended to handle scalability constraints in ${skill}?`,
                options: [
                  "Model-View-Controller decoupled pattern",
                  "Distributed microservices with queue scaling",
                  "Monolithic synchronous execution blocks",
                  "Client-side local caching variables only"
                ],
                correctAnswer: 1,
                explanation: "Distributed microservices with queue scaling allows decoupling load peaks from databases."
              };
            }
            list.push({
              id: i,
              question: mcq.question,
              options: mcq.options,
              correctAnswer: mcq.correctAnswer,
              hint: "Read option labels carefully, keeping modular design patterns in mind.",
              explanation: mcq.explanation,
              category: i % 2 === 0 ? "application" : "concept"
            });
          }
          return JSON.stringify(list);
        }

        let questionsPool = MOCK_QUESTIONS_BY_SKILL[skillKey];
        if (!questionsPool) {
          // Look for partial matches
          const matchedKey = Object.keys(MOCK_QUESTIONS_BY_SKILL).find(k => skillKey.includes(k) || k.includes(skillKey));
          questionsPool = matchedKey ? MOCK_QUESTIONS_BY_SKILL[matchedKey] : null;
        }

        const list = [];
        for(let i=1; i<=count; i++) {
          let qText = "";
          let hintText = "Try structures that decouple code or improve algorithmic complexity.";
          let expectedPoints = ["Efficiency", "Robustness", "Clean code"];

          if (questionsPool && questionsPool[i - 1]) {
            qText = questionsPool[i - 1];
            hintText = "Mention core parameters, structures, or standard implementation libraries.";
            expectedPoints = ["Conceptual definition", "Implementation example", "Trade-offs"];
          } else {
            qText = `Mock Scenario Question #${i} for ${skill}: How do you approach designing, scaling, and debugging a production service configured with ${skill}?`;
            hintText = `Explain concrete performance profiles and common bugs associated with ${skill}.`;
            expectedPoints = ["Architecture definition", "Error-handling protocols", "Scalability solutions"];
          }

          list.push({
            id: i,
            question: qText,
            hint: hintText,
            category: i % 2 === 0 ? "application" : "concept",
            expectedKeyPoints: expectedPoints
          });
        }
        return JSON.stringify(list);
      }
      
      if (promptText.includes('evaluating an interview answer')) {
        const answerMatch = promptText.match(/Candidate's Answer:\s*"([\s\S]*?)"/i) || promptText.match(/Answer:\s*"([\s\S]*?)"/i);
        const answer = answerMatch ? answerMatch[1] : "";
        const questionMatch = promptText.match(/Question:\s*"([\s\S]*?)"/i);
        const question = questionMatch ? questionMatch[1].replace(/[\"\']/g, "") : "the question";
        
        let score = 5;
        let verdict = "Average";
        if (!answer || answer.toLowerCase().includes("[skipped]")) {
          score = 0;
          verdict = "Poor";
        } else if (answer.length > 150) {
          score = 9;
          verdict = "Excellent";
        } else if (answer.length > 60) {
          score = 7;
          verdict = "Good";
        }
        
        let strengths = ["Provided a response addressing the question directly.", "Clear language structure without confusing terms."];
        let improvements = ["Could support points with code snippets or detailed diagrams.", "Expand on concrete edge-cases."];
        
        if (score >= 8) {
          strengths.push("Excellent explanation depth.");
          strengths.push("Direct answer to expected key points.");
        } else {
          improvements.push("Elaborate on production-level scalability options.");
        }

        return JSON.stringify({
          score: score,
          verdict: verdict,
          strengths: strengths,
          improvements: improvements,
          modelAnswer: `A comprehensive answer for: "${question}" should define the core principles, provide concrete coding/structural examples, and outline performance trade-offs under heavy loads.`,
          tip: "Use the STAR framework (Situation, Task, Action, Result) to format your responses for situational questions."
        });
      }

      if (promptText.includes('Explain this interview question simply')) {
        return "The question is testing your practical and theoretical awareness of this topic. Structure your response starting with a simple definition, then give a code or real-world example, and finish with a comparison of alternatives.";
      }

      return "Ensure you structure your response using clear bullet points. Highlight memory complexities and tool chain dependencies where applicable.";
    }
  