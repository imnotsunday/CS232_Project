const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'creator') {
      return response(403, { message: 'Only creators can create quizzes' });
    }

    const body = JSON.parse(event.body);
    const { activityId, questions } = body;

    // ตัวอย่าง question:
    // {
    //   question: "What is Python?",
    //   options: ["A fruit", "A snake", "A programming language", "A car"],
    //   answerIndex: 2,
    //   skill: "Python"
    // }

    if (!activityId || !Array.isArray(questions) || questions.length === 0) {
      return response(400, { message: 'Missing activityId or invalid questions' });
    }

    const quizItem = {
      activityId,
      questions,
      createdAt: new Date().toISOString(),
    };

    await docClient.put({
      TableName: 'Quizzes',
      Item: quizItem
    }).promise();

    return response(201, { message: 'Quiz created successfully' });

  } catch (err) {
    console.error('Create quiz error:', err);
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
