# StudySync - Spaced Repetition Flashcard System

## Overview

StudySync is a modern flashcard application built with Next.js that implements a comprehensive spaced repetition learning system with evidence-based scheduling, gamification, and persistence.

## Features Implemented

### ✅ Professional UI Enhancements

- **Color-coded buttons**: Green for "Mark Correct", Red for "Mark Wrong", Blue for primary actions
- **Gradient backgrounds**: Professional visual design with modern aesthetics
- **Smooth transitions**: Hover effects and scaling animations
- **Consistent navbar**: Unified design across the application
- **Removed loading states**: Clean button interactions without distracting loading indicators

### ✅ Daily Streak System

- **Automatic tracking**: Daily practice sessions are automatically recorded
- **Streak maintenance**: Consecutive daily practice maintains streak count
- **Streak breaking**: Missing a day breaks the streak and resets to 0
- **Visual feedback**: Dashboard shows current streak, longest streak, and broken streak warnings
- **Real-time countdown**: Timer showing time remaining to maintain current streak
- **Practice history**: Calendar view showing all practice days with visual indicators

### ✅ Spaced Repetition Algorithm

- **Evidence-based intervals**: [1, 3, 7, 14, 30, 60, 120, 240] days
- **Adaptive scheduling**: Interval progression based on correctness
- **Daily session management**: Intelligent card selection with limits
- **Pull-forward logic**: Cards due within 24 hours are included in today's session

### ✅ Enhanced Analytics Dashboard

- **Dynamic statistics**: Real-time display of streak, cards reviewed, accuracy, and level
- **Visual streak indicators**: Fire icons and color coding for active/broken streaks
- **Practice calendar**: Monthly view of practice history with visual day markers
- **Streak statistics**: Current streak, longest streak, total practice days, average per week
- **Progress tracking**: XP, level progression, and performance metrics

### ✅ Gamification System

- **XP calculation**: Base points + interval bonuses for correct answers
- **Level progression**: Dynamic leveling based on accumulated XP
- **Progress tracking**: Visual progress bars and level displays
- **Session statistics**: Accuracy, streak, and performance metrics
- **Achievement tracking**: Longest streak records and milestone celebrations

### ✅ Persistence & Storage

- **Dual persistence**: Backend API + localStorage fallback
- **Learning state tracking**: Interval index, next review dates, success rates
- **Session progress**: Comprehensive session data and analytics
- **API integration**: Enhanced flashcard API with learning endpoints

### ✅ Enhanced Study Experience

- **Daily sessions**: Optimized card selection for effective learning
- **Success rate display**: Per-card performance metrics
- **Learning stages**: Visual representation of mastery progress
- **Session completion**: Detailed results and continuation options

## Technical Architecture

### Core Files

- **`/lib/learning.ts`**: Complete spaced repetition algorithm implementation + streak management
- **`/components/StudyFlashcards.tsx`**: Enhanced study interface with gamification and streak tracking
- **`/components/StreakHistory.tsx`**: Practice history calendar and streak analytics display
- **`/app/assistant/page.tsx`**: Updated dashboard with real-time streak statistics
- **`/lib/api.js`**: Extended API client with learning persistence and streak endpoints

### Algorithm Details

- **Scheduling Function**: `scheduleNextReview()` - Updates card learning state
- **Session Selection**: `selectDailySession()` - Selects optimal daily card set
- **Streak Management**: `updateStreakData()` - Tracks daily practice and maintains streaks
- **Streak Detection**: `checkStreakStatus()` - Identifies broken streaks and resets counters
- **XP Calculation**: Dynamic point system with interval-based bonuses
- **Level System**: Progressive difficulty and achievement tracking

### Streak System Details

1. **Daily Practice Tracking**: Each completed study session updates streak data
2. **Consecutive Day Logic**: Practicing today and tomorrow maintains streak
3. **Streak Breaking**: Missing more than 1 day automatically resets streak to 0
4. **Visual Feedback**: Dashboard shows current streak status with countdown timer
5. **Historical Data**: Calendar view displays practice history for motivation
6. **Statistics**: Tracks current streak, longest streak, total practice days, and averages

### Persistence Strategy

1. **Primary**: Backend API calls for centralized data storage
2. **Fallback**: localStorage for offline capability and reliability
3. **State Management**: Real-time updates with optimistic UI

## Usage

1. **Start Development Server**:

   ```bash
   cd client
   npm run dev
   ```

2. **Access Application**: http://localhost:3001

3. **Study Flow**:
   - Cards are automatically selected based on spaced repetition
   - Answer cards to advance through learning stages
   - Earn XP and level up based on performance
   - Track progress with detailed analytics

## API Endpoints

- `PUT /flashcards/card/:id` - Update individual card learning state
- `PUT /flashcards/cards/batch` - Batch update multiple cards
- `POST /flashcards/session` - Save session progress with streak data
- `GET /flashcards/stats/:deckId?` - Retrieve learning statistics
- `GET /flashcards/streak` - Get user streak data and history
- `POST /flashcards/streak` - Update streak information

## Testing

- Manual tests available in `learning.test.ts`
- Browser console: Run `runLearningTests()` for algorithm validation
- Jest setup prepared but not fully configured due to npm conflicts

## Next Steps

1. **Jest Configuration**: Complete test framework setup
2. **Backend Integration**: Implement API endpoints for full persistence
3. **Analytics Dashboard**: Add detailed learning progress visualizations
4. **Mobile Optimization**: Responsive design improvements

## Learning Algorithm Benefits

- **Optimized retention**: Evidence-based intervals maximize memory retention
- **Efficient study time**: Focus on cards that need review
- **Progressive difficulty**: Gradual advancement through mastery levels
- **Streak motivation**: Daily practice streaks maintain consistent engagement
- **Visual progress**: Calendar history and statistics provide clear feedback
- **Adaptive learning**: System responds to individual performance patterns
- **Gamification elements**: XP, levels, and streaks increase motivation and engagement
