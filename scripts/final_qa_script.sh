#!/bin/bash

# Final QA Execution Script
# 
# Runs all QA tests sequentially with menu-driven interface
# Writes results to qa-results/ with timestamps
# Never blocks CI (can run in background)
#
# Usage: bash scripts/final_qa_script.sh [--ci]
#   --ci: Run in CI mode (non-interactive, no menus)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check for CI mode
CI_MODE=false
if [[ "$1" == "--ci" ]]; then
  CI_MODE=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/qa-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="$RESULTS_DIR/qa_results_${TIMESTAMP}.txt"
SUMMARY_FILE="$RESULTS_DIR/qa_summary_${TIMESTAMP}.json"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Initialize results
PASSED=0
FAILED=0
WARNINGS=0
TOTAL=0

# Function to log result
log_result() {
  local status=$1
  local test_name=$2
  local message=$3
  
  TOTAL=$((TOTAL + 1))
  
  if [ "$status" == "PASS" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}✅ PASS${NC}: $test_name" | tee -a "$RESULTS_FILE"
    if [ -n "$message" ]; then
      echo "   $message" | tee -a "$RESULTS_FILE"
    fi
  elif [ "$status" == "FAIL" ]; then
    FAILED=$((FAILED + 1))
    echo -e "${RED}❌ FAIL${NC}: $test_name" | tee -a "$RESULTS_FILE"
    if [ -n "$message" ]; then
      echo "   $message" | tee -a "$RESULTS_FILE"
    fi
  elif [ "$status" == "WARN" ]; then
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  WARN${NC}: $test_name" | tee -a "$RESULTS_FILE"
    if [ -n "$message" ]; then
      echo "   $message" | tee -a "$RESULTS_FILE"
    fi
  fi
  
  echo "" | tee -a "$RESULTS_FILE"
}

# Function to run command and log result
run_test() {
  local test_name=$1
  shift
  local command="$@"
  
  echo -e "${BLUE}Running: ${test_name}${NC}" | tee -a "$RESULTS_FILE"
  echo "Command: $command" | tee -a "$RESULTS_FILE"
  
  if eval "$command" >> "$RESULTS_FILE" 2>&1; then
    log_result "PASS" "$test_name" ""
    return 0
  else
    log_result "FAIL" "$test_name" "Command failed: $command"
    return 1
  fi
}

# Function to check if command exists
check_command() {
  local cmd=$1
  if command -v "$cmd" &> /dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to display menu
show_menu() {
  if [ "$CI_MODE" == "true" ]; then
    return
  fi
  
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}QA Test Menu${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "1. Run All Tests"
  echo "2. Environment Validation"
  echo "3. Code Quality Checks"
  echo "4. Build Verification"
  echo "5. Health Check"
  echo "6. Unit Tests"
  echo "7. Integration Tests"
  echo "8. E2E Tests (Playwright)"
  echo "9. Mobile E2E Tests (Detox)"
  echo "10. Type Checking"
  echo "11. Linting"
  echo "12. Format Check"
  echo "13. Load Tests"
  echo "14. Exit"
  echo ""
  read -p "Select option (1-14): " choice
  echo ""
}

# Function to run all tests
run_all_tests() {
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}Running All QA Tests${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Results will be saved to: $RESULTS_FILE"
  echo ""
  
  # Environment Validation
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}1. Environment Validation${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "node"; then
    if [ -f "$PROJECT_ROOT/.env.staging" ]; then
      run_test "Environment Variables Validation" "cd $PROJECT_ROOT && node scripts/validate-env.js staging" || true
    else
      log_result "WARN" "Environment Variables Validation" ".env.staging not found, skipping"
    fi
  else
    log_result "FAIL" "Environment Variables Validation" "Node.js not found"
  fi
  
  # Preflight Check
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}2. Preflight Check${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "node"; then
    run_test "Preflight Beta Check" "cd $PROJECT_ROOT && node scripts/preflight-beta.js" || true
  else
    log_result "FAIL" "Preflight Beta Check" "Node.js not found"
  fi
  
  # Code Quality
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}3. Code Quality Checks${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "pnpm"; then
    run_test "Type Checking" "cd $PROJECT_ROOT && pnpm typecheck" || true
    run_test "Linting" "cd $PROJECT_ROOT && pnpm lint" || true
    run_test "Format Check" "cd $PROJECT_ROOT && pnpm format:check" || true
  else
    log_result "FAIL" "Code Quality Checks" "pnpm not found"
  fi
  
  # Unit Tests
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}4. Unit Tests${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "pnpm"; then
    run_test "Unit Tests (Vitest)" "cd $PROJECT_ROOT && pnpm test" || true
  else
    log_result "FAIL" "Unit Tests" "pnpm not found"
  fi
  
  # Integration Tests
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}5. Integration Tests${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "pnpm"; then
    run_test "Integration Tests" "cd $PROJECT_ROOT && pnpm test" || true
  else
    log_result "FAIL" "Integration Tests" "pnpm not found"
  fi
  
  # E2E Tests
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}6. E2E Tests (Playwright)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "pnpm"; then
    if check_command "playwright"; then
      run_test "E2E Tests (Playwright)" "cd $PROJECT_ROOT && pnpm test:e2e" || true
    else
      log_result "WARN" "E2E Tests (Playwright)" "Playwright not installed, skipping"
    fi
  else
    log_result "FAIL" "E2E Tests" "pnpm not found"
  fi
  
  # Build Verification
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}7. Build Verification${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "pnpm"; then
    run_test "Staging Build" "cd $PROJECT_ROOT && pnpm build:staging" || true
    if [ -d "$PROJECT_ROOT/out" ]; then
      log_result "PASS" "Static Export" "out/ directory exists"
      run_test "Export Validation" "cd $PROJECT_ROOT && pnpm validate:export" || true
    else
      log_result "FAIL" "Static Export" "out/ directory not found"
    fi
  else
    log_result "FAIL" "Build Verification" "pnpm not found"
  fi
  
  # Health Check
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}8. Health Check${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "curl"; then
    STAGING_URL=$(grep "NEXT_PUBLIC_APP_URL" "$PROJECT_ROOT/.env.staging" 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")
    if [ -n "$STAGING_URL" ]; then
      HEALTH_URL="${STAGING_URL}/api/health"
      if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
        if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
          log_result "PASS" "Health Check" "All services healthy"
        else
          log_result "WARN" "Health Check" "Some services degraded"
          echo "$HEALTH_RESPONSE" | tee -a "$RESULTS_FILE"
        fi
      else
        log_result "FAIL" "Health Check" "Health endpoint unreachable"
      fi
    else
      log_result "WARN" "Health Check" "Staging URL not configured"
    fi
  else
    log_result "WARN" "Health Check" "curl not available"
  fi
  
  # Load Tests (optional)
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}9. Load Tests (Optional)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if check_command "k6"; then
    if [ -d "$PROJECT_ROOT/load-tests" ]; then
      run_test "Load Tests" "cd $PROJECT_ROOT && pnpm loadtest" || true
    else
      log_result "WARN" "Load Tests" "load-tests directory not found"
    fi
  else
    log_result "WARN" "Load Tests" "k6 not installed, skipping"
  fi
  
  # Generate Summary
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}QA Test Summary${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
  echo -e "${YELLOW}⚠️  Warnings: ${WARNINGS}${NC}"
  echo -e "${RED}❌ Failed: ${FAILED}${NC}"
  echo -e "${BLUE}📊 Total: ${TOTAL}${NC}"
  echo ""
  echo "Results saved to: $RESULTS_FILE"
  echo ""
  
  # Generate JSON summary
  cat > "$SUMMARY_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "passed": $PASSED,
  "failed": $FAILED,
  "warnings": $WARNINGS,
  "total": $TOTAL,
  "results_file": "$RESULTS_FILE"
}
EOF
  
  echo "Summary saved to: $SUMMARY_FILE"
  echo ""
  
  # Exit code based on failures
  if [ $FAILED -gt 0 ]; then
    exit 1
  else
    exit 0
  fi
}

# Main execution
if [ "$CI_MODE" == "true" ]; then
  # CI mode: run all tests automatically
  run_all_tests
else
  # Interactive mode: show menu
  while true; do
    show_menu
    
    case $choice in
      1)
        run_all_tests
        read -p "Press Enter to continue..."
        ;;
      2)
        echo "Running Environment Validation..."
        if [ -f "$PROJECT_ROOT/.env.staging" ]; then
          node "$PROJECT_ROOT/scripts/validate-env.js" staging
        else
          echo "❌ .env.staging not found"
        fi
        read -p "Press Enter to continue..."
        ;;
      3)
        echo "Running Code Quality Checks..."
        pnpm typecheck
        pnpm lint
        pnpm format:check
        read -p "Press Enter to continue..."
        ;;
      4)
        echo "Running Build Verification..."
        pnpm build:staging
        pnpm validate:export
        read -p "Press Enter to continue..."
        ;;
      5)
        echo "Running Health Check..."
        STAGING_URL=$(grep "NEXT_PUBLIC_APP_URL" "$PROJECT_ROOT/.env.staging" 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")
        if [ -n "$STAGING_URL" ]; then
          curl -s "${STAGING_URL}/api/health" | jq .
        else
          echo "❌ Staging URL not configured"
        fi
        read -p "Press Enter to continue..."
        ;;
      6)
        echo "Running Unit Tests..."
        pnpm test
        read -p "Press Enter to continue..."
        ;;
      7)
        echo "Running Integration Tests..."
        pnpm test
        read -p "Press Enter to continue..."
        ;;
      8)
        echo "Running E2E Tests (Playwright)..."
        pnpm test:e2e
        read -p "Press Enter to continue..."
        ;;
      9)
        echo "Running Mobile E2E Tests (Detox)..."
        echo "⚠️  This requires mobile emulator/simulator"
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
          pnpm e2e:android || pnpm e2e:ios
        fi
        read -p "Press Enter to continue..."
        ;;
      10)
        echo "Running Type Checking..."
        pnpm typecheck
        read -p "Press Enter to continue..."
        ;;
      11)
        echo "Running Linting..."
        pnpm lint
        read -p "Press Enter to continue..."
        ;;
      12)
        echo "Running Format Check..."
        pnpm format:check
        read -p "Press Enter to continue..."
        ;;
      13)
        echo "Running Load Tests..."
        pnpm loadtest
        read -p "Press Enter to continue..."
        ;;
      14)
        echo "Exiting..."
        exit 0
        ;;
      *)
        echo "Invalid option. Please select 1-14."
        read -p "Press Enter to continue..."
        ;;
    esac
  done
fi

