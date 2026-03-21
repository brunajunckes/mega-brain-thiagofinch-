template:
  id: squad-readme-template-v1
  name: Squad README
  version: 1.0
  output:
    format: markdown
    filename: README.md
    title: "{{squad_name}} README"

workflow:
  mode: interactive
  elicitation: advanced-elicitation
  custom_elicitation:
    title: "README Documentation Elicitation"
    sections:
      - id: documentation-depth
        options:
          - "Minimal README - Basic overview and usage only"
          - "Standard README - Full documentation with examples"
          - "Comprehensive README - Complete guide with integration details"

sections:
  - id: initial-setup
    instruction: |
      Initial Setup for README Generation

      Gather information about the squad:
      - Squad name and purpose
      - Target users and use cases
      - Main features and capabilities
      - Example workflows
      - Installation requirements

      Output file location: `squads/{{squad_name}}/README.md`

  - id: header
    title: Header Section
    instruction: Generate squad title and brief description
    template: |
      # {{pack_title}}

      ## Overview

      {{pack_overview}}

  - id: purpose
    title: Purpose Section
    instruction: Explain why this squad exists and what problems it solves
    template: |
      ## Purpose

      This squad {{pack_purpose}}

      {{purpose_details}}

  - id: when-to-use
    title: When to Use
    instruction: List specific scenarios when users should activate this squad
    template: |
      ## When to Use This Squad

      Use {{squad_name}} when you want to:

      {{use_cases}}

  - id: whats-included
    title: What's Included
    instruction: |
      List all components included in the squad:
      - Agents (with brief description)
      - Tasks (with brief description)
      - Templates (with brief description)
      - Checklists (with brief description)
      - Data/Knowledge bases (with brief description)
    template: |
      ## What's Included

      ### Agents

      {{agent_list}}

      ### Tasks

      {{task_list}}

      ### Templates

      {{template_list}}

      ### Checklists

      {{checklist_list}}

      ### Data

      {{data_list}}

  - id: installation
    title: Installation Instructions
    template: |
      ## Installation

      To install this squad, run:

      ```bash
      npm run install:squad {{squad_name}}
      ```

      Or manually:

      ```bash
      node tools/install-squad.js {{squad_name}}
      ```

  - id: usage-examples
    title: Usage Examples
    instruction: |
      Create 2-3 concrete usage examples showing:
      - How to activate agents
      - How to use commands
      - Expected workflows
      - Sample outputs
    elicit: true
    template: |
      ## Usage Examples

      {{usage_examples}}

  - id: squad-structure
    title: Squad Structure
    instruction: Show the directory structure of the squad
    template: |
      ## Squad Structure

      ```
      squads/{{squad_name}}/
      ├── agents/                          # Domain-specific agents
      {{agents_structure}}
      ├── checklists/                      # Validation checklists
      {{checklists_structure}}
      ├── config.yaml                      # Squad configuration
      ├── data/                           # Knowledge bases
      {{data_structure}}
      ├── README.md                       # Squad documentation
      ├── tasks/                          # Workflow tasks
      {{tasks_structure}}
      └── templates/                      # Output templates
      {{templates_structure}}
      ```

  - id: key-features
    title: Key Features
    instruction: Highlight 3-5 distinguishing features of this squad
    template: |
      ## Key Features

      {{key_features}}

  - id: integration
    title: Integration with Core AIOX
    instruction: Explain how this squad integrates with AIOX framework
    template: |
      ## Integration with Core AIOX

      {{squad_name}} integrates seamlessly with:

      {{integration_details}}

  - id: workspace-governance
    title: Workspace Integration Governance
    instruction: |
      Declare required workspace integration level and contract.
      Use canonical levels: none | read_only | read_write | workspace_first.
    template: |
      ## Workspace Integration Governance

      - **Integration level:** `{{workspace_integration_level}}`
      - **Rationale:** {{workspace_integration_rationale}}
      - **Read paths:** {{workspace_read_paths}}
      - **Write paths:** {{workspace_write_paths}}
      - **Template namespace:** {{workspace_template_namespace}}

      ### Required structural artifacts
      - `config.yaml` with `workspace_integration.level`
      - `scripts/bootstrap-*-workspace.sh` (if `workspace_first`)
      - `scripts/validate-*-essentials.sh` (if `workspace_first`)

  - id: getting-started
    title: Getting Started Guide
    instruction: Provide step-by-step guide for first-time users
    template: |
      ## Getting Started

      {{getting_started_steps}}

  - id: best-practices
    title: Best Practices
    condition: Standard or Comprehensive README
    template: |
      ## Best Practices

      {{best_practices}}

  - id: customization
    title: Customization
    condition: Standard or Comprehensive README
    template: |
      ## Customization

      You can customize this squad by:

      {{customization_options}}

  - id: dependencies
    title: Dependencies
    template: |
      ## Dependencies

      This squad requires:

      - Core AIOX-FULLSTACK framework
      {{additional_dependencies}}

  - id: support
    title: Support & Community
    condition: Comprehensive README
    template: |
      ## Support & Community

      - **Documentation**: See `docs/squads.md` for detailed guides
      - **Examples**: Browse `squads/` for reference implementations
      - **Issues**: Report problems via GitHub issues
      - **Contributions**: Submit PRs with improvements

  - id: version-history
    title: Version History
    template: |
      ## Version History

      - **v{{version}}** - {{version_description}}

  - id: footer
    title: Footer
    template: |
      ---

      **Ready to {{pack_tagline}}? Let's get started! 🚀**

      _Version: {{version}}_
      _Compatible with: AIOX-FULLSTACK v4+_
