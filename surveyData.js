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

function constructIdentities(schemaPages, response) {
    let identity = {
        name: "survey user name",
        email: "survey user email address",
        organization: "associated organization",
        teamName: "survey user's team name",
        teamType: "type of survey user's team",
        representingTeam: "true",
        roleInTeam: "your role in your team"
    };

    const generalInfoSchema = getSection("General");
    const teamInfoSchema = getSection("Team");
    const generalAnswers = findAnswers(response, generalInfoSchema.id);
    const teamAnswers = findAnswers(response, teamInfoSchema.id);

    generalInfoSchema.questions.find((answerKey, i) => {
        if ([0,1,3].includes(i)) {
            identity[Object.keys(identity)[i]] = generalAnswers.questions[i].answers[0].text;
        } else {
            identity[Object.keys(identity)[i]] = getAnswer(answerKey, generalAnswers, i).text;
        }
    });

    if (identity.representingTeam.toLowerCase() !== 'individually') {
        teamInfoSchema.questions.find((answerKey, i) => {
            let answer = getAnswer(answerKey, teamAnswers, i);
            identity.roleInTeam = answer != null ?  answer.text : "No role given";
        });
    }

    return identity;
}

function constructScores(schemaPages, response) {
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
    const explorationSchema = getSection('Exploration');
    const integrationSchema = getSection('Integration');
    const deploymentSchema = getSection('Deployment');
    const demandSchema = getSection('Demand');
    const explorationAnswers = findAnswers(response, explorationSchema.id);
    const integrationAnswers = findAnswers(response, integrationSchema.id);
    const deploymentAnswers = findAnswers(response, deploymentSchema.id);
    const demandAnswers = findAnswers(response, demandSchema.id);
    let question_count = 0;
    let answer;

    explorationSchema.questions.forEach((answerKey, questionIdx) => {
        answer = getAnswer(answerKey, explorationAnswers, questionIdx);
        scores[question_count].value = answer != null ? answer.position : 0;
        question_count++;
    });

    integrationSchema.questions.forEach((answerKey, questionIdx) => {
        answer = getAnswer(answerKey, integrationAnswers, questionIdx);
        scores[question_count].value = answer != null ? answer.position : 0;
        question_count++;
    });

    deploymentSchema.questions.forEach((answerKey, questionIdx) => {
        answer = getAnswer(answerKey, deploymentAnswers, questionIdx);
        scores[question_count].value = answer != null ? answer.position : 0;
        question_count++;
    });

    demandSchema.questions.forEach((answerKey, questionIdx) => {
        answer = getAnswer(answerKey, demandAnswers, questionIdx);
        scores[question_count].value = answer != null ? answer.position : 0;
        question_count++;
    });
    
    return scores;   
 }

 function getAnswer(answerKey, answers, questionIdx) {
    if (answers.questions.length > 0) {
        return (answerKey.answers.choices.find((choice) =>
            choice.id === answers.questions[questionIdx].answers[0].choice_id));
    } else {
        return null;
    }
 }

function getSection(titleNamePartial) {
    return schemaPages.find(p => p.title.includes(titleNamePartial));
}

function findAnswers(response, schemaSectionId) {
    return response.pages.find(x => x.id == schemaSectionId);
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
                return constructScores(schemaPages, surveyResponses);
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
                return constructScores(schemaPages, surveyResponses);
            })
            .catch(error => console.error(error));
    }
}