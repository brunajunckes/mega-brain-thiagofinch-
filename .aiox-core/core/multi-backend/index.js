'use strict';

const { MultiBackendExecutor, LocalBackend, DockerBackend, SSHBackend, ModalBackend } = require('./executor');

module.exports = {
  MultiBackendExecutor,
  LocalBackend,
  DockerBackend,
  SSHBackend,
  ModalBackend,
};
