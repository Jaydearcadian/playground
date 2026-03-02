import { validateTopic } from './observatory.js';

export function generateTopics({ transferTopic, approvalTopic }) {
  return {
    transfer_topic: transferTopic,
    approval_topic: approvalTopic,
    is_transfer_valid: validateTopic(transferTopic),
    is_approval_valid: validateTopic(approvalTopic),
  };
}

export function validateTopics(payload) {
  return {
    transfer_topic: payload.transfer_topic,
    approval_topic: payload.approval_topic,
    transfer_valid: validateTopic(payload.transfer_topic),
    approval_valid: validateTopic(payload.approval_topic),
  };
}
