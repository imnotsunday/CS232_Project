const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const docClient = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'advisor') {
      return response(403, { message: 'Only advisors can access this summary' });
    }

    // 1. ดึง Participation ทั้งหมด (หรือเฉพาะ student ของ advisor ถ้ามีระบบ mapping)
    const result = await docClient.scan({
      TableName: 'Participation',
    }).promise();

    const participation = result.Items || [];
    const studentMap = {};

    for (const record of participation) {
      const sid = record.userId;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          name: record.name,
          totalActivities: 0,
          softSkills: new Set(),
          hardSkills: new Set()
        };
      }

      studentMap[sid].totalActivities++;

      const activity = await docClient.get({
        TableName: 'Activities',
        Key: { activityId: record.activityId }
      }).promise();

      if (activity.Item?.softSkills) {
        for (const skill of activity.Item.softSkills) {
          studentMap[sid].softSkills.add(skill);
        }
      }

      if (record.acquiredHardSkills) {
        for (const skill of record.acquiredHardSkills) {
          studentMap[sid].hardSkills.add(skill);
        }
      }
    }

    // 2. แปลง Set ให้เป็น Array
    const studentList = Object.values(studentMap).map(s => ({
      studentId: s.studentId,
      name: s.name,
      totalActivities: s.totalActivities,
      softSkills: Array.from(s.softSkills),
      hardSkills: Array.from(s.hardSkills)
    }));

    return response(200, { students: studentList });

  } catch (err) {
    console.error('Get advisor students error:', err);
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
