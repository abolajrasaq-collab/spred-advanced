#!/bin/bash

# Git Helper Scripts for Spred Android App

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to start new feature
start_feature() {
    if [ -z "$1" ]; then
        print_error "Please provide feature name: ./scripts/git-helpers.sh start-feature feature-name"
        exit 1
    fi
    
    FEATURE_NAME="feature/$1"
    print_status "Starting new feature: $FEATURE_NAME"
    
    # Switch to develop and pull latest
    git checkout develop
    git pull origin develop
    
    # Create and switch to new feature branch
    git checkout -b $FEATURE_NAME
    print_success "Created and switched to $FEATURE_NAME"
}

# Function to finish feature
finish_feature() {
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [[ ! $CURRENT_BRANCH =~ ^feature/ ]]; then
        print_error "You must be on a feature branch to finish it"
        exit 1
    fi
    
    print_status "Finishing feature: $CURRENT_BRANCH"
    
    # Switch to develop
    git checkout develop
    git pull origin develop
    
    # Merge feature branch
    git merge $CURRENT_BRANCH
    
    # Push to develop
    git push origin develop
    
    # Delete feature branch
    git branch -d $CURRENT_BRANCH
    git push origin --delete $CURRENT_BRANCH
    
    print_success "Feature $CURRENT_BRANCH merged and deleted"
}

# Function to create hotfix
create_hotfix() {
    if [ -z "$1" ]; then
        print_error "Please provide hotfix name: ./scripts/git-helpers.sh create-hotfix hotfix-name"
        exit 1
    fi
    
    HOTFIX_NAME="hotfix/$1"
    print_status "Creating hotfix: $HOTFIX_NAME"
    
    # Switch to main and pull latest
    git checkout main
    git pull origin main
    
    # Create hotfix branch
    git checkout -b $HOTFIX_NAME
    print_success "Created hotfix branch: $HOTFIX_NAME"
}

# Function to finish hotfix
finish_hotfix() {
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [[ ! $CURRENT_BRANCH =~ ^hotfix/ ]]; then
        print_error "You must be on a hotfix branch to finish it"
        exit 1
    fi
    
    print_status "Finishing hotfix: $CURRENT_BRANCH"
    
    # Merge to main
    git checkout main
    git pull origin main
    git merge $CURRENT_BRANCH
    git push origin main
    
    # Merge to develop
    git checkout develop
    git pull origin develop
    git merge $CURRENT_BRANCH
    git push origin develop
    
    # Delete hotfix branch
    git branch -d $CURRENT_BRANCH
    git push origin --delete $CURRENT_BRANCH
    
    print_success "Hotfix $CURRENT_BRANCH merged and deleted"
}

# Function to sync with remote
sync_branches() {
    print_status "Syncing all branches with remote..."
    
    git fetch origin
    
    # Update main
    git checkout main
    git pull origin main
    
    # Update develop
    git checkout develop
    git pull origin develop
    
    print_success "All branches synced"
}

# Function to show branch status
show_status() {
    print_status "Current Git Status:"
    echo ""
    
    echo "Current branch: $(git branch --show-current)"
    echo ""
    
    echo "Branch status:"
    git status --short
    echo ""
    
    echo "Recent commits:"
    git log --oneline -5
    echo ""
    
    echo "All branches:"
    git branch -a
}

# Function to clean up merged branches
cleanup_branches() {
    print_status "Cleaning up merged branches..."
    
    # Delete local branches that are merged
    git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d
    
    print_success "Cleaned up merged branches"
}

# Main script logic
case "$1" in
    "start-feature")
        start_feature "$2"
        ;;
    "finish-feature")
        finish_feature
        ;;
    "create-hotfix")
        create_hotfix "$2"
        ;;
    "finish-hotfix")
        finish_hotfix
        ;;
    "sync")
        sync_branches
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup_branches
        ;;
    *)
        echo "Git Helper Script for Spred Android App"
        echo ""
        echo "Usage: $0 {command} [argument]"
        echo ""
        echo "Commands:"
        echo "  start-feature <name>    - Start a new feature branch"
        echo "  finish-feature          - Finish current feature branch"
        echo "  create-hotfix <name>    - Create a new hotfix branch"
        echo "  finish-hotfix           - Finish current hotfix branch"
        echo "  sync                    - Sync all branches with remote"
        echo "  status                  - Show current Git status"
        echo "  cleanup                 - Clean up merged branches"
        echo ""
        echo "Examples:"
        echo "  $0 start-feature user-authentication"
        echo "  $0 create-hotfix crash-fix"
        echo "  $0 status"
        ;;
esac
