'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowLeft, Ticket } from 'lucide-react';
import {
  dailyQuestions,
  streak,
  QUESTIONS,
  QUIZ_CATEGORIES,
  freshQuestions,
  quizCategory,
} from '@/data/quiz';
import { longestStreak } from '@/lib/engagement';
import { useStore } from './store';
import { useDay } from './use-day';
export function Quiz() {
  const day = useDay();
  const [category, setCategory] = useState(''),
    [revealed, setRevealed] = useState(false);
  const [activeKey, setActiveKey] = useState('');
  const { state, answer, beginQuiz, ready } = useStore();
  const params = useSearchParams(),
    router = useRouter();
  const requested = params.get('quiz');
  const archive = requested && state.quiz[requested]?.complete ? requested : null;
  useEffect(() => {
    if (archive) setCategory(quizCategory(archive));
  }, [archive]);
  const categoryKey =
    category === 'General Cinema' && state.quiz[day + ':Cinema'] ? 'Cinema' : category;
  const runKey =
      archive || (activeKey.startsWith(day + ':') ? activeKey : '') || day + ':' + categoryKey,
    run = state.quiz[runKey];
  const questions =
    run?.questionIds?.length === 5
      ? run.questionIds.map((id) => QUESTIONS.find((q) => q.id === id)!).filter(Boolean)
      : dailyQuestions(day, category);
  const answers = run?.answers || [],
    done = answers.length === 5 && !revealed,
    index = Math.min(4, Math.max(0, answers.length - (revealed ? 1 : 0))),
    q = questions[index];
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  useEffect(() => setRevealed(false), [day]);
  const best = (c: string) =>
    Math.max(
      0,
      ...Object.entries(state.quiz)
        .filter(([key, r]) => quizCategory(key) === c && r.complete)
        .map(([, r]) => r.score || 0),
    );
  function newRound(c = category) {
    const runs = Object.entries(state.quiz).filter(([key]) => quizCategory(key) === c);
    const number = runs.filter(([key]) => key.startsWith(day + ':')).length + 1;
    const key = day + ':' + c + ':round:' + number;
    const chosen = freshQuestions(
      c,
      key,
      runs.flatMap(([, r]) => r.questionIds || []),
      run?.questionIds || [],
    );
    beginQuiz(
      key,
      chosen.map((q) => q.id),
    );
    setActiveKey(key);
    setCategory(c);
    setRevealed(false);
    if (archive) router.replace('/#screen-test', { scroll: false });
  }
  function chooseCategory(c: string) {
    const pending = Object.entries(state.quiz).find(
      ([key, r]) => key.startsWith(day + ':') && quizCategory(key) === c && !r.complete,
    );
    if (pending) {
      setActiveKey(pending[0]);
      setCategory(c);
      setRevealed(false);
      return;
    }
    const completed = Object.entries(state.quiz).some(
      ([key, r]) => key.startsWith(day + ':') && quizCategory(key) === c && r.complete,
    );
    if (completed) {
      newRound(c);
      return;
    }
    setActiveKey('');
    setCategory(c);
    setRevealed(false);
  }
  const completed = Object.entries(state.quiz).filter(([, r]) => r.complete).length;
  return (
    <section className="quiz-section" id="screen-test">
      <div className="quiz-intro">
        <p className="eyebrow">08 / FIVE QUESTIONS. ONE LITTLE EGO CHECK.</p>
        <h2>
          The daily
          <br />
          <em>screen test.</em>
        </h2>
        <p>
          Nine doors into cinema. Choose your category.
          <br />A daily five. Fresh rounds whenever you replay.
        </p>
        <div className="quiz-ticket">
          <Ticket size={23} />
          <span>DISCOVERY STREAK</span>
          <strong>{day ? streak(state.completedDays, day) : 0}</strong>
          <span>DAYS</span>
        </div>
        <p className="engagement-mini">
          Longest: {longestStreak(state.completedDays)} days · {completed} quizzes completed
        </p>
        <details className="streak-explainer">
          <summary>How the streak works</summary>
          <p>
            Complete a quiz, explore a daily pick, or finish Today’s Feeling. Any one activity
            counts that day once. Days change at midnight Asia/Kolkata. Missing a day starts a new
            current streak; your longest streak stays saved.
          </p>
        </details>
      </div>
      <div className="quiz-card">
        {!ready || !day ? (
          <p>Loading your daily screen test…</p>
        ) : !category ? (
          <>
            <div className="quiz-progress">
              <span>CHOOSE YOUR SCENE</span>
              <span>{day} · IST</span>
            </div>
            <div className="quiz-category-grid">
              {QUIZ_CATEGORIES.map((c, i) => {
                const r =
                  state.quiz[day + ':' + c] ||
                  (c === 'General Cinema' ? state.quiz[day + ':Cinema'] : undefined);
                return (
                  <button
                    key={c}
                    onClick={() => {
                      chooseCategory(c);
                    }}
                  >
                    <span>0{i + 1} ↗</span>
                    <strong>{c}</strong>
                    <small>
                      {r?.complete
                        ? `Today: ${r.score}/5`
                        : r?.answers.length
                          ? `${r.answers.length}/5 answered`
                          : 'Five questions waiting'}{' '}
                      · Best {best(c)}/5
                    </small>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="quiz-category-heading">
              <button
                onClick={() => {
                  setCategory('');
                  setActiveKey('');
                  setRevealed(false);
                  if (archive) router.replace('/#screen-test', { scroll: false });
                }}
              >
                <ArrowLeft size={14} />
                Categories
              </button>
              <strong>{category}</strong>
              <span>BEST {best(category)}/5</span>
            </div>
            {done ? (
              <div className="quiz-summary">
                <p className="eyebrow">THAT'S A WRAP / {runKey.slice(0, 10)}</p>
                <strong>
                  {score}
                  <small>/5</small>
                </strong>
                <h3>
                  {score === 5
                    ? 'You know your frames.'
                    : score >= 3
                      ? 'A well-trained eye.'
                      : 'A few new things to watch.'}
                </h3>
                <p>
                  {archive && archive.slice(0, 10) !== day
                    ? 'An earlier screen test, kept in your trail. Your score and original question set are preserved.'
                    : 'Score saved. Play a fresh round; unseen questions come first. Your streak still counts today once.'}
                </p>
                <button className="button violet" onClick={() => newRound()}>
                  Play a fresh round <ArrowUpRight size={16} />
                </button>
                <p className="quiz-repeat-note">
                  Questions rotate from a verified bank. Once you’ve seen them all, older questions
                  return.
                </p>
                <details>
                  <summary>Review all five answers</summary>
                  {questions.map((q) => (
                    <p key={q.id}>
                      <b>{q.question}</b>
                      <br />
                      {q.explanation}{' '}
                      <a href={q.source} target="_blank" rel="noreferrer">
                        Verified source ↗
                      </a>
                    </p>
                  ))}
                </details>
              </div>
            ) : q ? (
              <>
                <div className="quiz-progress">
                  <span>QUESTION {index + 1} / 5</span>
                  <span>{day} · IST</span>
                </div>
                <h3>{q.question}</h3>
                <div className="quiz-options">
                  {q.options.map((option, i) => (
                    <button
                      key={option}
                      disabled={revealed}
                      className={
                        revealed
                          ? i === q.answer
                            ? 'correct'
                            : answers[index] === i
                              ? 'wrong'
                              : ''
                          : ''
                      }
                      onClick={() => {
                        if (revealed) return;
                        answer(
                          runKey,
                          [...answers, i],
                          day,
                          questions.map((q) => q.id),
                        );
                        setRevealed(true);
                      }}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {option}
                    </button>
                  ))}
                </div>
                {revealed && (
                  <div aria-live="polite">
                    <p className="quiz-explanation">
                      <strong>
                        {answers[index] === q.answer ? 'That’s the one.' : 'Now you know.'}
                      </strong>{' '}
                      {q.explanation}{' '}
                      <a href={q.source} target="_blank" rel="noreferrer">
                        Check the source ↗
                      </a>
                    </p>
                    <button className="button violet" onClick={() => setRevealed(false)}>
                      {answers.length === 5 ? 'See my score' : 'Next question'}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p>This saved question set is unavailable. Your completed attempt is preserved.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
