/**
 * Unit Tests for StudyFlashcards Component
 *
 * To run these tests, first install the required testing dependencies:
 * npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jest @types/jest
 *
 * Test Coverage:
 * - Load a small deck and assert initial question view
 * - Click SHOW ANSWER reveals answer
 * - Click MAKE RIGHT increments correct and advances after ~1s
 * - QUIT calls onQuit
 * - Summary shows correct counts
 * - Keyboard shortcuts work
 * - Auto-advance functionality
 * - SessionStorage integration
 * - Empty deck handling
 * - Progress tracking
 */

// TODO: Uncomment and use when testing dependencies are installed

/*
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import StudyFlashcards, { StudyFlashcard } from '@/components/StudyFlashcards';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock window.matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockFlashcards: StudyFlashcard[] = [
  {
    id: '1',
    question: 'What is React?',
    answer: 'A JavaScript library for building user interfaces',
    shownAnswer: false,
    result: null,
  },
  {
    id: '2',
    question: 'What is TypeScript?',
    answer: 'A typed superset of JavaScript',
    shownAnswer: false,
    result: null,
  },
  {
    id: '3',
    question: 'What is Next.js?',
    answer: 'A React framework for production',
    shownAnswer: false,
    result: null,
  },
];

describe('StudyFlashcards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads a small deck and shows initial question view', async () => {
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Deck')).toBeInTheDocument();
    });

    // Should show first question
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    
    // Should not show answer initially
    expect(screen.queryByText('A JavaScript library for building user interfaces')).not.toBeInTheDocument();
    
    // Should show question phase buttons
    expect(screen.getByText('Show Answer')).toBeInTheDocument();
    expect(screen.getByText('Quit')).toBeInTheDocument();
    
    // Should not show answer phase buttons
    expect(screen.queryByText('Make Right')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark Wrong')).not.toBeInTheDocument();

    // Should show progress
    expect(screen.getByText('Card 1 / 3')).toBeInTheDocument();
  });

  it('reveals answer when Show Answer is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // Click Show Answer
    await user.click(screen.getByText('Show Answer'));

    // Answer should be revealed
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
    
    // Buttons should change to answer phase
    expect(screen.getByText('Make Right')).toBeInTheDocument();
    expect(screen.getByText('Mark Wrong')).toBeInTheDocument();
    
    // Question phase buttons should be gone
    expect(screen.queryByText('Show Answer')).not.toBeInTheDocument();
    expect(screen.queryByText('Quit')).not.toBeInTheDocument();
  });

  it('increments correct count and advances after Make Right with 1s delay', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // Show answer first
    await user.click(screen.getByText('Show Answer'));
    
    // Initially 0 correct
    expect(screen.getByText('0 correct')).toBeInTheDocument();
    
    // Click Make Right
    await user.click(screen.getByText('Make Right'));
    
    // Should show 1 correct immediately
    expect(screen.getByText('1 correct')).toBeInTheDocument();
    
    // Should still be on first card
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    
    // Buttons should be disabled during wait
    expect(screen.getByText('Make Right')).toBeDisabled();
    expect(screen.getByText('Mark Wrong')).toBeDisabled();
    
    // Advance time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      // Should advance to next card
      expect(screen.getByText('What is TypeScript?')).toBeInTheDocument();
    });
    
    // Progress should update
    expect(screen.getByText('Card 2 / 3')).toBeInTheDocument();
    
    // Should be back to question phase
    expect(screen.getByText('Show Answer')).toBeInTheDocument();
  });

  it('calls onQuit when Quit is pressed', async () => {
    const mockOnQuit = jest.fn();
    const user = userEvent.setup();
    
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
        onQuit={mockOnQuit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Quit'));
    
    expect(mockOnQuit).toHaveBeenCalledTimes(1);
  });

  it('shows summary with correct counts when deck finishes', async () => {
    jest.useFakeTimers();
    const mockOnFinish = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    // Use single card for faster test
    const singleCard = [mockFlashcards[0]];
    
    render(
      <StudyFlashcards 
        flashcards={singleCard} 
        title="Test Deck"
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // Show answer and mark right
    await user.click(screen.getByText('Show Answer'));
    await user.click(screen.getByText('Make Right'));
    
    // Advance time to finish
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      // Should show summary dialog
      expect(screen.getByText('Study Session Complete!')).toBeInTheDocument();
    });
    
    // Should show correct stats
    expect(screen.getByText('1')).toBeInTheDocument(); // correct count
    expect(screen.getByText('0')).toBeInTheDocument(); // wrong count
    expect(screen.getByText('100%')).toBeInTheDocument(); // accuracy
    
    // Should have called onFinish
    expect(mockOnFinish).toHaveBeenCalledWith({
      total: 1,
      correct: 1,
      incorrect: 0,
    });
  });

  it('handles keyboard shortcuts correctly', async () => {
    const mockOnQuit = jest.fn();
    const user = userEvent.setup();
    
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
        onQuit={mockOnQuit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // Press Q to quit
    await user.keyboard('q');
    expect(mockOnQuit).toHaveBeenCalledTimes(1);
  });

  it('handles space key to show answer', async () => {
    const user = userEvent.setup();
    
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // Press space to show answer
    await user.keyboard(' ');
    
    // Answer should be revealed
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
  });

  it('handles empty deck gracefully', async () => {
    render(
      <StudyFlashcards 
        flashcards={[]} 
        title="Empty Deck"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No flashcards to study')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Generate flashcards from a PDF file first.')).toBeInTheDocument();
  });

  it('loads flashcards from sessionStorage when no props provided', async () => {
    const mockData = {
      qsAns: [
        { question: 'Session Q1', answer: 'Session A1' },
        { question: 'Session Q2', answer: 'Session A2' },
      ],
      title: 'Session Deck',
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockData));
    
    render(<StudyFlashcards />);
    
    await waitFor(() => {
      expect(screen.getByText('Session Deck')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Session Q1')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 2')).toBeInTheDocument();
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('currentFlashcards');
  });

  it('saves progress to sessionStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <StudyFlashcards 
        flashcards={mockFlashcards} 
        title="Test Deck"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('What is React?')).toBeInTheDocument();
    });

    // Show answer and mark right
    await user.click(screen.getByText('Show Answer'));
    
    // Should save progress
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'studyProgress',
      expect.stringContaining('currentIndex')
    );
  });
});
*/

export {}; // Make this a module to avoid TS errors
