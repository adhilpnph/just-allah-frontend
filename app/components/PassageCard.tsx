export type Passage = {
  ref: string;
  kind: string;
  collection: string | null;
  arabic: string;
  english: string;
  narrator: string | null;
  grade: string | null;
  graded_by: string | null;
  grades: Array<{ name: string; grade: string }> | null;
  url: string | null;
};

function storedGrades(passage: Passage) {
  if (passage.grades?.length) return passage.grades;
  if (passage.grade) {
    return [{ name: passage.graded_by ?? "Grader not specified", grade: passage.grade }];
  }
  return [];
}

export default function PassageCard({ passage }: { passage: Passage }) {
  const grades = storedGrades(passage);
  const hasWeakGrade = grades.some(({ grade }) => /^(daif|mawdu)$/i.test(grade.trim()));

  return (
    <article className="passage-card" aria-label={`Source ${passage.ref}`}>
      {hasWeakGrade && (
        <p className="weak-grade-status">
          Found, but graded weak or fabricated. Do not rely on it
        </p>
      )}
      <header className="passage-card-header">
        <h3>
          {passage.url ? (
            <a href={passage.url} target="_blank" rel="noreferrer">
              {passage.ref}
            </a>
          ) : (
            passage.ref
          )}
        </h3>
        {passage.collection && <p>{passage.collection}</p>}
      </header>
      <div className="passage-text-grid">
        <p className="arabic-text" lang="ar" dir="rtl">
          {passage.arabic}
        </p>
        <div className="translation-block">
          <p className="translation-label">Translation (may differ from the Arabic)</p>
          <p>{passage.english}</p>
          {passage.narrator && <p className="narrator">Narrator: {passage.narrator}</p>}
        </div>
      </div>
      {grades.length ? (
        <ul className="grade-list" aria-label="Source grades">
          {grades.map(({ name, grade }, index) => (
            <li key={`${name}-${grade}-${index}`}>
              {grade} — graded by {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-grade">No grade in the source data</p>
      )}
    </article>
  );
}
