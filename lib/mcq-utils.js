import { MCQS } from '@/data/mcq';

export function scoreAnswers(answers) {
    let correct = 0;
    MCQS.forEach(q => { if (answers[q.id] === q.correct) correct++; });
    return correct * 2;
}
