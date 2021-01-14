const exerciseList = new Observable();
const currentExercise = new Observable();

//Main
async function startModel(exerciseListCallback, currentExerciseCallback) {
    exerciseList.callback = exerciseListCallback;
    currentExercise.callback = currentExerciseCallback;
    fetchExerciseList().then((result) => {
        console.log('function result');
        console.log(result);
        exerciseList.set(result);
    });
}

async function fetchExerciseList() {
    let result;
    await $.getJSON('/api/public', (data) => {
        result = data;
    })
    return result;
}