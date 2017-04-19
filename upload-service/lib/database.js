'use strict';

const AWS = require('aws-sdk');

const config = {
  region: AWS.config.region || process.env.SERVERLESS_REGION || 'us-east-1',
};

const dynamodb = new AWS.DynamoDB.DocumentClient(config);

/**
 * Gets session by session id
 * @param id
 */
const getSession = (id) =>
  dynamodb.get({
    TableName: process.env.SESSION_TABLE_NAME,
    Key: {
      id,
    },
  }).promise();

/**
 * Inserts session
 * @param data
 */
const insertSession = (data) =>
  dynamodb.put({
    TableName: process.env.SESSION_TABLE_NAME,
    Item: data,
  }).promise();

/**
 * Updates session
 * @param data
 */
const updateSession = (data) => {
  const updateData = Object.keys(data).reduce((result, item) => {
    const updateExpressionAttributeName = {};
    const attributeName = `#${item}`;
    updateExpressionAttributeName[attributeName] = item;
    result.ExpressionAttributeNames =     // eslint-disable-line no-param-reassign
      Object.assign({}, result.ExpressionAttributeNames, updateExpressionAttributeName);

    const updateExpressionAttributeValue = {};
    const attributeValueName = `:${item}`;
    updateExpressionAttributeValue[attributeValueName] = data[item];
    result.ExpressionAttributeValues =    // eslint-disable-line no-param-reassign
      Object.assign({}, result.ExpressionAttributeValues, updateExpressionAttributeValue);

    if (item !== 'id') {
      result.UpdateExpression.push(`${attributeName} = ${attributeValueName}`);
    }

    return result;
  }, {
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
    UpdateExpression: [],
  });

  const params = Object.assign({
    TableName: process.env.SESSION_TABLE_NAME,
    ConditionExpression: '#id = :id',
    Key: {
      id: data.id,
    },
    ReturnValues: 'ALL_NEW',
  }, {
    ExpressionAttributeNames: updateData.ExpressionAttributeNames,
    ExpressionAttributeValues: updateData.ExpressionAttributeValues,
    UpdateExpression: `set ${updateData.UpdateExpression.join(', ')}`,
  });

  console.log('update', JSON.stringify(params));
  return dynamodb.update(params).promise()
    .catch((error) => {
      console.log(error);
      return error;
    });
};

module.exports = {
  getSession,
  insertSession,
  updateSession,
};
