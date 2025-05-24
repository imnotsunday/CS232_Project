const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'admin') {
      return response(403, { message: 'Only admin can approve activities' });
    }

    const activityId = event.pathParameters?.activityId;

    if (!activityId) {
      return response(400, { message: 'Missing activityId in path' });
    }

    // ตรวจสอบก่อนว่ากิจกรรมนี้มีจริงไหม
    const existing = await docClient.get({
      TableName: 'Activities',
      Key: { activityId }
    }).promise();

    if (!existing.Item) {
      return response(404, { message: 'Activity not found' });
    }

    // อัปเดต status เป็น approved
    await docClient.update({
      TableName: 'Activities',
      Key: { activityId },
      UpdateExpression: 'SET #s = :approved',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':approved': 'approved' }
    }).promise();

    return response(200, { message: 'Activity approved successfully' });

  } catch (err) {
    console.error('Approve activity error:', err);
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
