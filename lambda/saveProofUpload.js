const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'student') {
      return response(403, { message: 'Only students can save proof' });
    }

    const body = JSON.parse(event.body);
    const { activityId, proofImageUrl } = body;

    if (!activityId || !proofImageUrl) {
      return response(400, { message: 'Missing activityId or proofImageUrl' });
    }

    const key = `${activityId}_${requester.userId}`;

    await docClient.update({
      TableName: 'Participation',
      Key: { activityId_userId: key },
      UpdateExpression: 'SET proofImageUrl = :url',
      ExpressionAttributeValues: { ':url': proofImageUrl }
    }).promise();

    return response(200, { message: 'Proof image URL saved successfully' });

  } catch (err) {
    console.error('Save proof error:', err);
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
