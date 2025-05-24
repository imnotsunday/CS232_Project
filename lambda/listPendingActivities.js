const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'admin') {
      return response(403, { message: 'Only admin can view pending activities' });
    }

    // ถ้ายังไม่ได้ตั้ง GSI ตาม status → ใช้ scan
    const result = await docClient.scan({
      TableName: 'Activities',
      FilterExpression: '#s = :pending',
      ExpressionAttributeNames: {
        '#s': 'status'
      },
      ExpressionAttributeValues: {
        ':pending': 'pending'
      }
    }).promise();

    return response(200, { activities: result.Items });

  } catch (err) {
    console.error('List pending activities error:', err);
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
