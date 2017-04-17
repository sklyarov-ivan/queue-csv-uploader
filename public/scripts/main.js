'use strict';

(function() {

  var socket = io();

  socket.on('connect', function(client) {
    socket.emit('getLast10Rows', {});
    socket.on('getLast10Rows', getLast10Rows);
    socket.on('fileParseComplete', function() {
      socket.emit('getLast10Rows', {});
    });
  });

  function getLast10Rows(data) {
    var usersBlock = document.getElementById('usersList');
    usersBlock.innerHTML = null;
    data.forEach(function(item) {
      var name = document.createElement("span");
      name.innerHTML = item.FirstName;
      name.style.padding = '10px';

      var lastname = document.createElement("span");
      lastname.innerHTML = item.Surname;
      lastname.style.padding = '10px';

      var email = document.createElement("span");
      email.innerHTML = item.Email;
      email.style.padding = '10px';

      var created_at = document.createElement("span");
      created_at.innerHTML = item.created_at;
      created_at.style.padding = '10px';

      var nodeWrapper = document.createElement("div");
      nodeWrapper.style.margin = '10px';
      nodeWrapper
      .appendChild(name)
      .appendChild(lastname)
      .appendChild(email)
      .appendChild(created_at);

      usersBlock.appendChild(nodeWrapper);
    });
  }
})();
