// global constants
const HOST = 'https://api.surveymonkey.net/v3';
const TOKEN = 'gGjGCiPUvNABVM9Wt5MT1AfGjd3oHhxTfnmeJF0dfoO-nhx0qTt9ghByZOdFNjpz8S0ld5xsqH85RIuEBKFdc-emcrNjStDT3Rqqf4oSDVB0KN4fg-ClwAM-8RGveVrG';


function getSurveySchemaIdByTitle(title) {
    const apiCall = '/surveys?title=' + title;
    return get(HOST + apiCall)
        .then(response => {
            // put in variable, verify length. If 0, then return null
            return response.data.filter(x => x.title === title)[0].id;
        });
}

function getSurveySchemaPagesById(schema_id) {
    const apiCall = '/surveys/' + schema_id + '/details';
    return get(HOST + apiCall)
        .then(response => response.pages);
 }

function getSurveyResponses(schema_id) {
    const apiCall = '/surveys/' + schema_id + '/responses/bulk';
    return get(HOST + apiCall)
        .then(response => response.data);
}

function returnScores(schemaPages, response) {
    let scores = [
        {axis:"Hypothesize",value:0},
        {axis:"Collaborate & Research",value:0},
        {axis:"Architect",value:0},
        {axis:"Synthesize",value:0},
        {axis:"Develop",value:0},
        {axis:"Build",value:0},
        {axis:"Test End-To-End",value:0},
        {axis:"Stage",value:0},
        {axis:"Deploy",value:0},
        {axis:"Verify",value:0},
        {axis:"Monitor",value:0},
        {axis:"Respond",value:0},
        {axis:"Release",value:0},
        {axis:"Stabilize",value:0},
        {axis:"Measure",value:0},
        {axis:"Learn",value:0}
    ];

    // will return data array with scores for each question. 
    const explorationSchema = schemaPages.find(p => p.title.includes('Exploration'));
    const integrationSchema = schemaPages.find(p => p.title.includes('Integration'));
    const deploymentSchema = schemaPages.find(p => p.title.includes('Deployment'));
    const demandSchema = schemaPages.find(p => p.title.includes('Demand'));
    const explorationAnswers = response.pages.find(x => x.id == explorationSchema.id);
    const integrationAnswers = response.pages.find(x => x.id === integrationSchema.id);
    const deploymentAnswers = response.pages.find(x => x.id === deploymentSchema.id);
    const demandAnswers = response.pages.find(x => x.id === demandSchema.id);
    let question_count = 0;

    explorationSchema.questions.forEach((answerKey, questionIdx) => {
        scoreAnswers(question_count, answerKey, explorationAnswers, questionIdx);
        question_count++;
    });

    integrationSchema.questions.forEach((answerKey, questionIdx) => {
        scoreAnswers(question_count, answerKey, integrationAnswers, questionIdx);
        question_count++;
    });

    deploymentSchema.questions.forEach((answerKey, questionIdx) => {
        scoreAnswers(question_count, answerKey, deploymentAnswers, questionIdx);
        question_count++;
    });

    demandSchema.questions.forEach((answerKey, questionIdx) => {
        scoreAnswers(question_count, answerKey, demandAnswers, questionIdx);
        question_count++;
    });


    function scoreAnswers(question_count, answerKey, answers, questionIdx) {
        scores[question_count].value = (answerKey.answers.choices.find((choice) =>
            choice.id === answers.questions[questionIdx].answers[0].choice_id).position);
    }
    
    return scores;
    
    // Also, need to add general identity information to json object array
    // (name, email, organization, team name, team type, individual/team collab, team role if team collab) to each record
}

function get(url) {
    return fetch(url, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + TOKEN
        }
    })
    .then(response => { 
        if (response.ok) {
            return response.json();
        }
        throw new Error('Network response failure');
    });
}

function loadFile(uri, file) {
    const uriPath = uri + '/' + file;
    return get(uriPath)
        .then(response => response);
}

function getSurveyData(useFacade = true, schemaId = 0) {
    const surveyTitle = 'DevOps Health Radar Survey';
    let schemaPages, surveyResponses;

    if (useFacade) {
        const uri = 'http://localhost:3000/test/data';
        loadFile(uri, 'schema.json')
            .then(schema => {
                schemaPages = schema;
                return loadFile(uri,'responses.json')
            })
            .then(responses => {
                surveyResponses = responses;
            })
            .finally(() => {
                return returnScores(schemaPages, surveyResponses);
            });		
    } else {
        getSurveySchemaIdByTitle(surveyTitle)
            .then(id => {
                schemaId = id;
                return getSurveySchemaPagesById(schemaId)
            })
            .then(schema => {
                schemaPages = schema;
                return getSurveyResponses(schemaId);
            })
            .then(responses => {
                surveyResponses = responses;
            })
            .finally(() => {
                return returnScores(schemaPages, surveyResponses);
            })
            .catch(error => console.error(error));
    }
}