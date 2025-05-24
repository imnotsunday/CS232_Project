const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'student') {
      return response(403, { message: 'Only students can submit quiz' });
    }

    const activityId = event.pathParameters?.activityId;
    if (!activityId) {
      return response(400, { message: 'Missing activityId in path' });
    }

    const body = JSON.parse(event.body);
    const { answers, proofImageUrl } = body;

    const quizResult = await docClient.get({
      TableName: 'Quizzes',
      Key: { activityId }
    }).promise();

    if (!quizResult.Item) {
      return response(404, { message: 'Quiz not found for this activity' });
    }

    const questions = quizResult.Item.questions;
    const acquiredSkills = [];
    let correctCount = 0;

    questions.forEach((q, index) => {
      if (answers[index] === q.answerIndex) {
        correctCount++;
        acquiredSkills.push(q.skill);
      }
    });

    const participationItem = {
      activityId_userId: `${activityId}_${requester.userId}`,
      activityId,
      userId: requester.userId,
      name: requester.name,
      dateSubmitted: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      acquiredHardSkills: acquiredSkills,
      proofImageUrl: proofImageUrl || null
    };

    await docClient.put({
      TableName: 'Participation',
      Item: participationItem
    }).promise();

    return response(200, {
      message: 'Quiz submitted successfully',
      correctCount,
      total: questions.length,
      acquiredSkills
    });

  } catch (err) {
    console.error('Submit quiz error:', err);
    return response(500, { message: 'Internal server error', error: err.message });
  }
};

function verifyToken(token) {
  if (!token) throw new Error('Missing token');
  return jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
  };
}
