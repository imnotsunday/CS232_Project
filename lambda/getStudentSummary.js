const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'student') {
      return response(403, { message: 'Only students can view their summary' });
    }

    const result = await docClient.query({
      TableName: 'Participation',
      IndexName: 'userId-index', // ต้องมี GSI บน userId ถ้า PK เป็น activityId_userId
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': requester.userId
      }
    }).promise();

    const participation = result.Items || [];

    let softSkills = {};
    let hardSkills = {};
    let totalActivities = participation.length;

    for (const record of participation) {
      // Soft Skills ต้องดึงจาก Activities
      const activityRes = await docClient.get({
        TableName: 'Activities',
        Key: { activityId: record.activityId }
      }).promise();

      const activity = activityRes.Item;
      if (activity) {
        for (const skill of activity.softSkills || []) {
          softSkills[skill] = (softSkills[skill] || 0) + 1;
        }
      }

      for (const skill of record.acquiredHardSkills || []) {
        hardSkills[skill] = (hardSkills[skill] || 0) + 1;
      }
    }

    return response(200, {
      totalActivities,
      softSkills,
      hardSkills
    });

  } catch (err) {
    console.error('Get student summary error:', err);
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
