const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    // นักศึกษาเรียกดูของตัวเอง หรือ advisor/admin เรียกดูของคนอื่นได้
    const studentId = event.pathParameters?.userId;
    if (!studentId) {
      return response(400, { message: 'Missing student userId in path' });
    }

    const result = await docClient.query({
      TableName: 'Participation',
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': studentId
      }
    }).promise();

    const participation = result.Items || [];

    const softSkillSet = new Set();
    const hardSkillSet = new Set();

    for (const record of participation) {
      // ดึง soft skill จากกิจกรรม
      const activity = await docClient.get({
        TableName: 'Activities',
        Key: { activityId: record.activityId }
      }).promise();

      if (activity.Item?.softSkills) {
        for (const skill of activity.Item.softSkills) {
          softSkillSet.add(skill);
        }
      }

      if (record.acquiredHardSkills) {
        for (const skill of record.acquiredHardSkills) {
          hardSkillSet.add(skill);
        }
      }
    }

    return response(200, {
      userId: studentId,
      softSkills: Array.from(softSkillSet),
      hardSkills: Array.from(hardSkillSet)
    });

  } catch (err) {
    console.error('Get student skills error:', err);
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
