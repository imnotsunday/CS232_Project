const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    verifyToken(token); // ตรวจสอบว่าเป็นผู้ใช้ที่ login แล้ว

    const activityId = event.pathParameters?.id;

    if (!activityId) {
      return response(400, { message: 'Missing activityId in path' });
    }

    const result = await docClient.get({
      TableName: 'Activities',
      Key: { activityId }
    }).promise();

    if (!result.Item) {
      return response(404, { message: 'Activity not found' });
    }

    return response(200, { activity: result.Item });

  } catch (err) {
    console.error('Get activity error:', err);
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
