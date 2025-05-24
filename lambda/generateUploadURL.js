const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const s3 = new AWS.S3();
const JWT_SECRET = process.env.JWT_SECRET;
const BUCKET_NAME = process.env.BUCKET_NAME || 'skillio-proof-uploads';

exports.handler = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const requester = verifyToken(token);

    if (requester.role !== 'student') {
      return response(403, { message: 'Only students can upload proof' });
    }

    const activityId = event.pathParameters?.activityId;
    if (!activityId) {
      return response(400, { message: 'Missing activityId in path' });
    }

    const fileName = `${activityId}/${requester.userId}-${Date.now()}.jpg`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      ContentType: 'image/jpeg',
      Expires: 300 // 5 นาที
    };

    const uploadURL = s3.getSignedUrl('putObject', params);

    return response(200, {
      uploadURL,
      fileURL: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`
    });

  } catch (err) {
    console.error('Generate upload URL error:', err);
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
