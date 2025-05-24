const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    verifyToken(token); // ไม่จำกัด role แค่ต้อง login แล้ว

    const activityId = event.pathParameters?.activityId;
    if (!activityId) {
      return response(400, { message: 'Missing activityId in path' });
    }

    const result = await docClient.get({
      TableName: 'Quizzes',
      Key: { activityId }
    }).promise();

    if (!result.Item) {
      return response(404, { message: 'Quiz not found for this activity' });
    }

    // ซ่อนคำตอบเพื่อไม่ให้ frontend เห็น answerIndex ก่อนเริ่มทำ quiz
    const cleanQuestions = result.Item.questions.map(q => ({
      question: q.question,
      options: q.options,
      skill: q.skill
    }));

    return response(200, {
      activityId,
      questions: cleanQuestions
    });

  } catch (err) {
    console.error('Get quiz error:', err);
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
