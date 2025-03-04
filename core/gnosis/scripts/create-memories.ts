/**
 * Gnosis Memory Creation Script
 *
 * This script creates sample memories by sending conversations to the Gnosis API.
 * It's useful for testing and development purposes.
 *
 * Usage:
 *   pnpm tsx scripts/create-memories.ts --api-key=<your-api-key> [--verbose]
 */

import { GnosisApiClient, Message, ApiResponse } from "@gnosis.dev/sdk";
import { parseArgs } from "util";

// Console styling helpers
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

// Handle interruption signals gracefully - place this before the try block
process.on("SIGINT", () => {
  console.log(
    `\n\n${colors.yellow}⚠ Script interrupted by user${colors.reset}`
  );
  console.log(`${colors.dim}Exiting gracefully...${colors.reset}`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(`\n\n${colors.yellow}⚠ Script terminated${colors.reset}`);
  console.log(`${colors.dim}Exiting gracefully...${colors.reset}`);
  process.exit(0);
});

// Parse command line arguments
try {
  const args = parseArgs({
    options: {
      "api-key": { type: "string" },
      verbose: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      "user-id": { type: "string", default: "test-user-id" },
      "base-url": { type: "string" },
      limit: { type: "string", default: "100" }, // Number of memories to create
    },
    allowPositionals: true,
    strict: true, // This will throw an error on unknown options
  });

  // Show help if requested
  if (args.values.help) {
    console.log(`
Gnosis Memory Creation Script

Usage:
  bun scripts/create-memories.ts --api-key=<your-api-key> [options]

Options:
  --api-key=<key>       Your API key (REQUIRED)
  --user-id=<id>        User ID to associate with memories (default: test-user-id)
  --base-url=<url>      Custom API base URL (default: http://localhost:8787 or env)
  --limit=<number>      Maximum number of memories to create (default: 100)
  --verbose             Show detailed information
  -h, --help            Show this help message
  `);
    process.exit(0);
  }

  // Configuration and constants
  const API_KEY = args.values["api-key"];
  const BASE_URL =
    args.values["base-url"] ||
    process.env.API_BASE_URL ||
    "http://localhost:8787";
  const USER_ID = args.values["user-id"] || "test-user-id";
  const VERBOSE = args.values.verbose || false;
  const MEMORY_LIMIT = parseInt(args.values.limit as string, 10) || 100;

  // Validate required configuration
  if (!API_KEY) {
    console.error(`
❌ ERROR: API key is REQUIRED.
Please provide your API key via the --api-key parameter.

Example:
  bun scripts/create-memories.ts --api-key=your_api_key_here
  
For more information, run:
  bun scripts/create-memories.ts --help
`);
    process.exit(1);
  }

  // Initialize the API client
  const apiClient = new GnosisApiClient({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    debug: VERBOSE,
  });

  // Base conversation templates
  const conversationTemplates = [
    // Conversation 1: Technical discussion about React
    [
      {
        role: "user",
        content:
          "What's the best way to manage state in a large React application?",
      },
      {
        role: "assistant",
        content:
          "For large React applications, you have several options for state management. Redux is a popular choice for its predictable state container and developer tools. Context API with useReducer can be good for simpler cases. React Query excels at server state management. Consider the complexity of your app, team familiarity, and specific needs when choosing.",
      },
      {
        role: "user",
        content:
          "I'm considering using Redux Toolkit. What are the pros and cons?",
      },
      {
        role: "assistant",
        content:
          "Redux Toolkit offers significant advantages: it reduces boilerplate code with createSlice, includes Redux Thunk for async logic, has good TypeScript support, and includes RTK Query for API calls. The main downsides are the learning curve if you're new to Redux concepts and potential overhead for simple applications. For large applications though, it provides excellent structure and maintainability.",
      },
    ],

    // Conversation 2: Project planning
    [
      {
        role: "user",
        content:
          "I need to plan a new software project. What's a good approach?",
      },
      {
        role: "assistant",
        content:
          "Start with clearly defining project requirements and objectives. Create user stories to understand what features are needed. Choose an appropriate methodology (Agile/Scrum often works well for software). Break down tasks, set up project tracking, and establish communication channels. Define your tech stack based on requirements. Consider creating a minimum viable product (MVP) first to get early feedback.",
      },
      {
        role: "user",
        content: "How should I prioritize features for the MVP?",
      },
      {
        role: "assistant",
        content:
          "For MVP feature prioritization, focus on features that: 1) Solve the core problem for users, 2) Provide the most value with minimal development effort, 3) Are essential for basic functionality, 4) Enable you to test key assumptions about your users' needs. Use a framework like MoSCoW (Must have, Should have, Could have, Won't have) or impact/effort mapping to visualize priorities.",
      },
    ],

    // Conversation 3: Personal productivity
    [
      {
        role: "user",
        content:
          "What are the best productivity techniques for software developers?",
      },
      {
        role: "assistant",
        content:
          "Effective productivity techniques for developers include: Pomodoro Technique (25 min work/5 min breaks), time blocking for focused coding, minimizing context switching, using to-do lists with prioritization, implementing automation for repetitive tasks, and applying agile methods personally (like weekly sprints and retrospectives). Also consider reducing distractions by using focus modes and scheduled communication times.",
      },
      {
        role: "user",
        content: "I struggle with constant interruptions. Any specific advice?",
      },
      {
        role: "assistant",
        content:
          "For handling interruptions: 1) Set 'do not disturb' hours and communicate them to your team, 2) Batch similar tasks together, 3) Use visual signals like headphones to indicate focus time, 4) Schedule specific times for emails and messages, 5) Configure notification settings to minimize distractions, 6) Consider a 'stand-up buffer' time after meetings for immediate questions, and 7) Document FAQs to reduce repeat questions.",
      },
    ],

    // Conversation 4: Database design question
    [
      {
        role: "user",
        content:
          "I'm designing a database for a social media application. What database type would you recommend?",
      },
      {
        role: "assistant",
        content:
          "For social media applications, a hybrid approach often works best. Use a relational database (PostgreSQL/MySQL) for structured user data, profiles, and relationships. Consider a document database (MongoDB) for content like posts with variable structures. For high-speed operations like feeds, a graph database (Neo4j) can handle complex relationships efficiently. Redis is excellent for caching and real-time features. Your specific requirements around scale, query patterns, and consistency needs should guide your final decision.",
      },
      {
        role: "user",
        content:
          "How would you structure the database to optimize for feed generation?",
      },
      {
        role: "assistant",
        content:
          "For optimized feed generation: 1) Consider a denormalized approach where recent posts are pre-computed and stored, 2) Implement a caching layer with Redis to store generated feeds, 3) Use materialized views for common feed queries, 4) Consider a dedicated feed service that uses a specialized database like Cassandra for write-heavy workloads, 5) Implement pagination and cursor-based approaches rather than offset, and 6) Use background workers to pre-generate feeds during low-traffic periods.",
      },
    ],

    // Conversation 5: Career advice
    [
      {
        role: "user",
        content:
          "What skills should I focus on to advance my career as a software engineer?",
      },
      {
        role: "assistant",
        content:
          "Beyond technical skills, focus on: 1) Communication - explaining complex topics clearly, 2) System design - architecting scalable solutions, 3) Business domain knowledge, 4) Project management and estimation, 5) Mentorship and code review skills, 6) Data structures and algorithms for problem-solving, 7) DevOps and CI/CD practices, and 8) Soft skills like conflict resolution and stakeholder management. Balance depth in your specialty with breadth across the stack.",
      },
      {
        role: "user",
        content: "Should I go for management or stay technical?",
      },
      {
        role: "assistant",
        content:
          "This depends on your interests and strengths. The technical track (architect, principal engineer, etc.) lets you solve complex problems and maintain hands-on work. The management track involves people development, process improvement, and strategic planning with less coding. Consider: Do you enjoy mentoring and coordinating people? Or do you prefer deep technical challenges? Many companies offer dual ladders so you can advance in either direction. Try leading small teams or technical initiatives first to test your preferences.",
      },
    ],
  ];

  // Additional topics to use for generating variations
  const topics = [
    // Programming languages
    "Python",
    "JavaScript",
    "TypeScript",
    "Rust",
    "Go",
    "Java",
    "Ruby",
    "C++",
    "Swift",
    "Kotlin",

    // Frameworks and libraries
    "React",
    "Angular",
    "Vue",
    "Next.js",
    "Express",
    "Django",
    "Flask",
    "Spring Boot",
    "Laravel",
    "Rails",

    // Technologies
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "Google Cloud",
    "Blockchain",
    "GraphQL",
    "REST API",
    "WebSockets",
    "WebAssembly",

    // Concepts
    "Microservices",
    "Serverless",
    "DevOps",
    "CI/CD",
    "Machine Learning",
    "Data Science",
    "AI",
    "Security",
    "Performance",
    "Accessibility",

    // Tools
    "Git",
    "Jenkins",
    "GitHub Actions",
    "VS Code",
    "JetBrains",
    "Webpack",
    "Babel",
    "ESLint",
    "Jest",
    "Cypress",

    // Soft skills
    "Communication",
    "Leadership",
    "Time Management",
    "Project Planning",
    "Team Collaboration",
    "Remote Work",
    "Career Growth",
    "Learning",
    "Mentoring",
    "Interview Preparation",

    // Database topics
    "SQL",
    "NoSQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Elasticsearch",
    "Cassandra",
    "DynamoDB",
    "Schema Design",

    // Mobile development
    "iOS",
    "Android",
    "React Native",
    "Flutter",
    "Mobile UX",
    "Push Notifications",
    "Offline Support",
    "App Store Optimization",
    "Mobile Security",
    "Responsive Design",
  ];

  // Variations of questions based on templates
  const questionVariations = [
    // React state management variations
    "What's better for managing state in React, Redux or Context API?",
    "Should I use Redux for a medium-sized React application?",
    "What are the trade-offs between different state management libraries in React?",
    "Is Redux Toolkit worth learning for React development?",
    "How does MobX compare to Redux for React state management?",
    "When should I use React Query instead of Redux?",
    "What's the learning curve for Recoil compared to Redux?",
    "Is Zustand a good alternative to Redux for React state?",
    "How do you handle form state in a large React application?",

    // Project planning variations
    "How do I break down features for an agile software project?",
    "What's the most important part of planning a new web application?",
    "How do you approach estimating work for a software project?",
    "What project management methodology works best for a small development team?",
    "How should I structure sprints for a new software project?",
    "What documentation is essential for a new software project?",
    "How do you prevent scope creep in software projects?",
    "What's the best way to prioritize technical debt versus new features?",
    "How do you determine the MVP for a new software product?",

    // Productivity variations
    "How can I reduce context switching as a developer?",
    "What tools help improve productivity for software engineers?",
    "How do you stay focused during long coding sessions?",
    "What daily habits make developers more productive?",
    "How do you track tasks and todos as a developer?",
    "What's the best way to manage email overflow as an engineer?",
    "How do you balance deep work with collaboration needs?",
    "What's the ideal environment setup for developer productivity?",
    "How do you measure your productivity as a developer?",

    // Database variations
    "What database should I use for a high-traffic e-commerce site?",
    "When should I choose NoSQL over SQL databases?",
    "How do you design efficient database schemas?",
    "What's the best approach for database migrations in production?",
    "How should I index a database for optimal performance?",
    "What database technology works best for real-time applications?",
    "Should I use an ORM or raw SQL queries?",
    "How do you handle database sharding for scalability?",
    "What's the best practice for database backups and disaster recovery?",

    // Career variations
    "What technologies should I learn to stay relevant as a developer?",
    "How important is specialization versus being a generalist in software engineering?",
    "What's the career path for a senior developer who doesn't want to manage?",
    "How do you negotiate a salary increase as a developer?",
    "What skills make someone stand out as a senior engineer?",
    "How do you transition from backend to frontend development?",
    "What's the best way to demonstrate leadership as an engineer?",
    "How important are side projects for career growth?",
    "What certifications are worth pursuing in software development?",
  ];

  /**
   * Generate a variation of a conversation by modifying the questions
   * @param baseConversation Base conversation to modify
   * @param questionVariation New variation of the first question
   * @param topic Topic to incorporate into the conversation
   * @returns Modified conversation
   */
  function generateConversationVariation(
    baseConversation: Array<{ role: string; content: string }>,
    questionVariation: string,
    topic: string
  ): Array<{ role: string; content: string }> {
    // Create a deep copy of the conversation
    const newConversation = JSON.parse(JSON.stringify(baseConversation));

    // Replace the first user message with the variation
    newConversation[0].content = questionVariation;

    // Modify the second message to incorporate the topic
    if (newConversation[1] && newConversation[1].role === "assistant") {
      // Insert the topic name into the response if possible
      newConversation[1].content = newConversation[1].content.replace(
        /(?:React|software|developers|database|social media)/i,
        topic
      );
    }

    // If there's a follow-up question, modify it slightly
    if (newConversation[2] && newConversation[2].role === "user") {
      // Add a reference to the topic in the follow-up question
      newConversation[2].content = `When working with ${topic}, ${newConversation[2].content.toLowerCase()}`;
    }

    return newConversation;
  }

  /**
   * Generate a large number of varied conversations
   * @param limit Maximum number of conversations to generate
   * @returns Array of conversation variations
   */
  function generateConversations(
    limit: number
  ): Array<Array<{ role: string; content: string }>> {
    const conversations: Array<Array<{ role: string; content: string }>> = [];

    // Start with the base conversations
    conversations.push(...conversationTemplates);

    // Generate variations until we reach the limit
    while (conversations.length < limit) {
      // Select a random base conversation
      const baseIndex = Math.floor(
        Math.random() * conversationTemplates.length
      );
      const baseConversation = conversationTemplates[baseIndex];

      // Select a random question variation based on the template type
      const startIndex = baseIndex * 9; // Each template has ~9 variations
      const variationIndex = startIndex + Math.floor(Math.random() * 9);
      const questionVariation =
        questionVariations[variationIndex % questionVariations.length];

      // Select a random topic
      const topic = topics[Math.floor(Math.random() * topics.length)];

      // Generate variation
      const variation = generateConversationVariation(
        baseConversation,
        questionVariation,
        topic
      );

      conversations.push(variation);
    }

    return conversations.slice(0, limit);
  }

  // Main function to create memories
  async function createMemories() {
    console.log(
      `\n${colors.bright}${colors.blue}🚀 Creating Test Memories for Gnosis${colors.reset}`
    );
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`User ID: ${USER_ID}`);
    console.log(`Generating up to ${MEMORY_LIMIT} memories`);
    console.log("---------------------------------------\n");

    // Generate varied conversations
    console.log(`Generating ${MEMORY_LIMIT} conversation variations...`);
    const sampleConversations = generateConversations(MEMORY_LIMIT);
    console.log(
      `Successfully generated ${sampleConversations.length} conversations`
    );

    const createdMemoryIds: string[] = [];

    // Create memories from sample conversations
    for (let i = 0; i < sampleConversations.length; i++) {
      const conversation = sampleConversations[i];

      try {
        console.log(
          `Creating memory ${i + 1}/${sampleConversations.length}...`
        );

        // Add conversation to create a memory
        const result = await apiClient.addMemory(
          USER_ID,
          conversation as Message[]
        );

        if (result.success) {
          if (
            result.data &&
            Array.isArray(result.data) &&
            result.data.length > 0
          ) {
            const memoryId = result.data[0].id;
            createdMemoryIds.push(memoryId);

            console.log(
              `${colors.green}✓ Created memory with ID: ${memoryId}${colors.reset}`
            );

            // Print the first message of the conversation
            const firstMessage = conversation[0].content;
            console.log(
              `${colors.dim}First message: ${firstMessage.substring(0, 60)}...${
                colors.reset
              }\n`
            );
          } else {
            // This is for the case where the API returns success but no memories were extracted
            console.log(
              `${colors.yellow}⚠ No new memories extracted from this conversation${colors.reset}\n`
            );
          }
        } else {
          console.log(
            `${colors.red}✗ Failed to create memory: ${
              result.error || "Unknown error"
            }${colors.reset}\n`
          );
        }
      } catch (error) {
        console.error(
          `${colors.red}✗ Error creating memory: ${
            error instanceof Error ? error.message : String(error)
          }${colors.reset}\n`
        );
      }
    }

    // Summary
    console.log("---------------------------------------");
    console.log(`${colors.bright}📊 Memory Creation Summary${colors.reset}`);
    console.log(
      `Total memories created: ${createdMemoryIds.length}/${sampleConversations.length}`
    );

    if (createdMemoryIds.length > 0) {
      console.log(`\n${colors.bright}Memory IDs:${colors.reset}`);
      // Only show the first 10 memory IDs to avoid cluttering the console
      const displayIds = createdMemoryIds.slice(0, 10);
      displayIds.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
      });

      if (createdMemoryIds.length > 10) {
        console.log(`... and ${createdMemoryIds.length - 10} more`);
      }
    }

    console.log("\nUse these memory IDs for testing purposes.");
  }

  // Run the script
  createMemories().catch((error) => {
    console.error(
      `\n${colors.red}${colors.bright}❌ Fatal Error:${colors.reset} ${colors.red}${error.message}${colors.reset}`
    );
    process.exit(1);
  });
} catch (error) {
  console.error(
    `\n${colors.red}${colors.bright}❌ Fatal Error:${colors.reset} ${
      colors.red
    }${error instanceof Error ? error.message : String(error)}${colors.reset}`
  );
  process.exit(1);
}
