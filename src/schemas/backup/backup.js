const { Schema, model } = require("mongoose");

const data = new Schema({
    User: String,
    BackupData: Array,
    BackupTemplate: Array
})

module.exports = model("user_server_backup", data);