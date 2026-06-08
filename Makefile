.PHONY: help install lint format format-check test build watch check

NPM ?= npm

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Install dev dependencies
	$(NPM) install

lint: ## Run ESLint
	$(NPM) run lint

lint-fix: ## Run ESLint with --fix
	$(NPM) run lint:fix

format: ## Format code with Prettier
	$(NPM) run format

format-check: ## Check formatting without writing
	$(NPM) run format:check

test: ## Run the test suite
	$(NPM) test

build: ## Build the Tailwind CSS bundle
	$(NPM) run build

watch: ## Rebuild CSS on change
	$(NPM) run watch

check: lint format-check test ## Run lint + format check + tests
