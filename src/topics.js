import { validateTopic } from './observatory.js';

export function generateTopics(body) {
  return {
    transfer_topic: body?.transfer_topic,
    approval_topic: body?.approval_topic,
    transfer_valid: validateTopic(body?.transfer_topic),
    approval_valid: validateTopic(body?.approval_topic),
  };
}

export function validateTopics(body) {
  return generateTopics(body);
}
