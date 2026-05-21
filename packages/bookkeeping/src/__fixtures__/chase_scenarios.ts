import type { ChaseDraftInput } from "../tools/chase_draft.js";

export interface ChaseScenario {
  id: string;
  input: ChaseDraftInput;
}

export const chaseScenarios: ChaseScenario[] = [
  {
    id: "chase-001-missing-receipts-friendly",
    input: {
      client: {
        name: "Sarah Johnson",
        email: "sarah@johnson-consulting.com",
      },
      transactions: [
        {
          id: "txn-006",
          date: "2024-03-06",
          amount: 34.5,
          description: "UBER TRIP SFO",
          missing: "receipt",
        },
        {
          id: "txn-009",
          date: "2024-03-09",
          amount: 52.4,
          description: "CLIENT DINNER - NOBU SF",
          missing: "receipt",
        },
        {
          id: "txn-011",
          date: "2024-03-11",
          amount: 38.99,
          description: "AMAZON OFFICE SUPPLIES",
          missing: "receipt",
        },
      ],
      tone: "friendly",
    },
  },

  {
    id: "chase-002-missing-categories-firm",
    input: {
      client: {
        name: "Marcus Rivera",
        email: "marcus@riverafreelance.io",
      },
      transactions: [
        {
          id: "txn-017",
          date: "2024-03-17",
          amount: 25.0,
          description: "AMZN MKTP US*AB1234",
          missing: "category",
        },
        {
          id: "txn-018",
          date: "2024-03-18",
          amount: 200.0,
          description: "WIRE TRANSFER REF 4821-B",
          missing: "category",
        },
      ],
      tone: "firm",
    },
  },

  {
    id: "chase-003-mixed-missing-neutral",
    input: {
      client: {
        name: "Priya Nair",
        email: "priya.nair@techstudio.co",
      },
      transactions: [
        {
          id: "txn-007",
          date: "2024-03-07",
          amount: 280.0,
          description: "UNITED AIRLINES SFO-JFK",
          missing: "receipt",
        },
        {
          id: "txn-019",
          date: "2024-03-19",
          amount: 15.99,
          description: "NETFLIX MONTHLY",
          missing: "memo",
        },
        {
          id: "txn-020",
          date: "2024-03-20",
          amount: 1200.0,
          description: "SUBCONTRACTOR PMT - JANE DOE",
          missing: "memo",
        },
      ],
      tone: "neutral",
    },
  },
];
