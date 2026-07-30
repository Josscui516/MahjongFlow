# Smart Activity and Task Management System

> A lightweight, web-based coordination platform designed for the Monash Mahjong Club.

**Course:** FIT3161 Computer Science Project  
**Team:** S1_CS_01  
**Project stage:** Early development  
**Primary users:** Monash Mahjong Club committee members

## Overview

The Smart Activity and Task Management System is being developed to help the Monash Mahjong Club coordinate its internal work through one central platform.

The club currently manages meetings, weekly sessions, tournaments, promotion work, attendance, and follow-up tasks across separate tools and informal communication channels. This makes it difficult to see who is responsible for each task, what is overdue, and whether important meeting decisions have been completed.

The proposed system connects the club's main operational workflow:

```text
Meeting decision -> Action task -> Event preparation -> Attendance verification -> Follow-up
```

The system is intended to remain simple enough for a small student committee while providing clearer accountability, progress visibility, and event coordination.

## Project Goals

The project aims to:

- centralise meeting records, tasks, events, attendance, and promotion work;
- convert meeting decisions into assignable and trackable action items;
- make task owners, deadlines, statuses, and overdue work clearly visible;
- support recurring Mahjong sessions and larger tournament preparation;
- improve attendance recording and dinner eligibility verification;
- protect sensitive attendance and participant information through role-based access;
- provide an interface that is lightweight, understandable, and practical for non-technical users.

## Core Features

| Module | Planned capabilities |
|---|---|
| **Authentication and access control** | Committee accounts, login, session handling, and role-based access to sensitive information |
| **Meeting management** | Create meeting records, capture discussion points and decisions, and review previous meetings |
| **Meeting-to-task conversion** | Convert decisions or discussion items into tasks and preserve the link to the original meeting |
| **Task coordination** | Create tasks, assign owners, set deadlines, update status, and link tasks to meetings or events |
| **Dashboard and reminders** | Display assigned, upcoming, pending, and overdue tasks with clear progress visibility |
| **Event management** | Create weekly session and tournament records, maintain event details, and reuse recurring workflows |
| **Registration and attendance** | Support simple participant registration, QR-based check-in, attendance records, and attendance summaries |
| **Dinner verification** | Confirm that a participant attended an eligible event before dinner support is provided |
| **Promotion coordination** | Manage event promotion tasks through stages such as Draft, Review, Ready to Post, and Completed |
| **Privacy controls** | Limit collection of participant data and restrict sensitive records to authorised committee roles |

## Target Users

### Primary users

The main users are the approximately seven Monash Mahjong Club committee members who organise and manage club activities. Depending on their responsibilities, they may act as executive committee members, event organisers, promotion coordinators, logistics coordinators, or authorised attendance managers.

### Secondary users

Club members and event participants may use limited functions such as:

- viewing event information;
- registering for an event;
- completing event check-in;
- receiving attendance-related confirmation.

Secondary users must not be able to access internal committee meetings, task boards, or sensitive attendance records.

## Project Scope

### In scope

- meeting notes, discussion points, decisions, and action tracking;
- meeting-to-task conversion;
- task assignment, deadlines, status tracking, filtering, and reminders;
- dashboards for pending and overdue work;
- weekly session and tournament event records;
- reusable event workflows or templates;
- simple participant registration;
- QR-based attendance check-in and attendance summaries;
- dinner eligibility verification;
- promotion task coordination;
- committee accounts and role-based permissions;
- lightweight participant data required for registration and attendance.

### Out of scope

To keep the project feasible, the following are not planned for the initial version:

- financial management, payments, membership fees, or budgeting;
- advanced tournament scoring, ranking, or gameplay logic;
- Mahjong table allocation;
- direct publishing through Instagram, Facebook, or other social media APIs;
- real-time chat or a replacement for existing messaging platforms;
- a native iOS or Android application;
- full club membership management;
- unnecessary enterprise-level project management functionality.

## Development Approach

The team will use an adapted **Agile and incremental development approach**.

Work will be divided into small, testable increments. Core workflows will be implemented before lower-priority improvements. Requirements may be refined after stakeholder reviews, prototype demonstrations, and usability feedback.

The development process is expected to include:

1. backlog refinement and sprint planning;
2. implementation of a small group of related requirements;
3. functional and integration testing;
4. stakeholder or team review;
5. retrospective and backlog reprioritisation;
6. delivery of the next working increment.

A Kanban-style project board may be used to visualise work through stages such as **Backlog**, **To Do**, **In Progress**, **Review**, **Testing**, and **Done**.

## High-Level Roadmap

1. **Planning and analysis**  
   Confirm scope, requirements, acceptance criteria, risks, architecture, and implementation priorities.

2. **System foundation**  
   Establish the repository structure, development environment, authentication, database foundation, and shared interface components.

3. **Core feature development**  
   Implement meeting management, task coordination, dashboards, reminders, events, attendance, and promotion workflows.

4. **Integration**  
   Connect frontend interfaces, backend services, permission rules, and database relationships.

5. **Testing and evaluation**  
   Perform functional, integration, usability, security, permission, and data-consistency testing.

6. **Deployment and handover**  
   Prepare the prototype, final documentation, setup instructions, user guidance, and project handover materials.

## Technology Stack

The final technology stack is still being confirmed. This section should be updated immediately after the team approves the architecture and development environment.

| Area | Technology |
|---|---|
| Frontend | To be confirmed |
| Backend | To be confirmed |
| Database | To be confirmed |
| Authentication | To be confirmed |
| Testing | To be confirmed |
| Deployment | To be confirmed |
| Project management | GitHub Issues / Projects or another team-approved Kanban tool |

## Proposed Repository Structure

The repository structure below is provisional and may be adapted to the selected technology stack.

```text
.
├── frontend/              # User interface and client-side logic
├── backend/               # Server, API, authentication, and business logic
├── database/              # Schema, migrations, seed data, and database documentation
├── tests/                 # Automated and manual test resources
├── docs/                  # Requirements, architecture, meeting, risk, and user documentation
├── .env.example           # Example environment variables without real secrets
├── .gitignore
└── README.md
```

## Getting Started

The project-specific installation commands will be added after the technology stack is finalised and verified from a clean environment.

For now, clone the repository using:

```bash
git clone <repository-url>
cd <repository-folder>
```

Before implementation begins, the repository should include:

- a confirmed prerequisites list;
- dependency installation commands;
- an `.env.example` file;
- database setup and migration instructions;
- development server commands;
- test commands;
- production or prototype build instructions.

Do not add setup commands to this README until they have been tested successfully from a fresh clone.

## Git Workflow

The following initial workflow is recommended for team development:

1. Create or select a GitHub issue for the work.
2. Create a short-lived branch from the current integration branch.
3. Implement one focused change.
4. Add or update relevant tests and documentation.
5. Open a pull request and link the related issue.
6. Request at least one teammate review.
7. Resolve review comments and confirm automated or manual checks.
8. Merge only when the change meets the team's Definition of Done.

Suggested branch names:

```text
feature/meeting-to-task
feature/event-registration
fix/attendance-permission
refactor/task-service
docs/setup-guide
test/event-workflow
```

Suggested commit prefixes:

```text
feat:     add a new user-facing capability
fix:      correct a defect
refactor: restructure code without changing behaviour
test:     add or update tests
docs:     update documentation
chore:    update tooling, dependencies, or configuration
```

Example:

```text
feat: convert meeting decisions into assigned tasks
```

## Definition of Done

A task or user story may be considered complete when:

- its linked requirement and acceptance criteria are satisfied;
- the implementation has been reviewed by another team member;
- relevant functional and integration tests pass;
- permission and privacy behaviour has been checked where applicable;
- database relationships remain consistent;
- user-facing behaviour has clear success and error feedback;
- documentation has been updated;
- no secrets, credentials, or real sensitive participant data are committed;
- the completed work is demonstrated to the team or stakeholder when appropriate.

## Testing Strategy

The project will use several complementary testing approaches:

- **Functional testing:** verifies that each requirement and acceptance criterion works as expected.
- **Integration testing:** verifies communication between the interface, backend services, authentication, and database.
- **Permission and security testing:** verifies that users cannot access functions or records outside their authorised role.
- **Database and consistency testing:** verifies relationships between meetings, tasks, events, registrations, and attendance records.
- **Usability walkthroughs:** checks whether committee members can complete common workflows clearly and efficiently.
- **Regression testing:** checks that new changes do not break previously completed features.

Where practical, test cases should be traceable to the project's Requirements Traceability Matrix.

## Privacy and Security Guidelines

This project may handle attendance and limited participant information. All contributors must therefore follow these rules:

- collect only the data required for registration and attendance;
- use fictional or anonymised data during development and testing;
- never commit passwords, access tokens, API keys, or private environment files;
- keep secrets in local environment variables;
- apply role-based access checks on the server, not only in the user interface;
- restrict attendance and participant records to authorised roles;
- do not upload real participant data to public repositories or unapproved services;
- report suspected data exposure to the team immediately.

## Project Documentation

Detailed project artefacts will be maintained in the repository or linked from the project workspace. These may include:

- project proposal and scope statement;
- Requirements Traceability Matrix;
- Work Breakdown Structure;
- Gantt chart and milestone plan;
- risk register;
- architecture and database diagrams;
- API documentation;
- test plan and test results;
- meeting minutes and decision records;
- user guide and deployment guide.

## Team

**FIT3161 Team S1_CS_01**

| Team member | Project contribution |
|---|---|
| Joshua Xingjian Cui | Planning, development, testing, documentation, and team review |
| Li Zhang | Planning, development, testing, documentation, and team review |
| Shiying Liao | Planning, development, testing, documentation, and team review |
| Xuanwei Xu | Planning, development, testing, documentation, and team review |
| Yubo Cai | Planning, development, testing, documentation, and team review |

Detailed feature ownership and current responsibilities should be tracked through issues, the project board, meeting minutes, and project documentation rather than remaining static in this README.

## Contributing

This repository is currently intended for the project team and authorised reviewers.

Team members should:

- keep changes focused and linked to an issue or requirement;
- communicate before making major architectural changes;
- avoid duplicating work already assigned to another member;
- review code respectfully and explain requested changes clearly;
- update documentation whenever behaviour, setup, or architecture changes;
- follow the agreed coding, testing, and Git conventions.

## Project Status

This README represents the initial project scope and development conventions. It should be treated as a living document and updated whenever the team confirms:

- the final product name;
- the technology stack;
- the repository structure;
- installation and run commands;
- deployment details;
- completed features;
- final screenshots or demonstration links.

## Licence

This is an academic project. An open-source licence has not yet been selected. Until a licence is added, the source code and project materials should not be copied, redistributed, or reused outside the project without permission from the team.

## Acknowledgements

The team acknowledges the Monash Mahjong Club for providing the project context and stakeholder needs, and the FIT3161 teaching team for project management and software development guidance.
