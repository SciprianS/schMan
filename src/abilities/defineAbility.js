const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(user) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === 'admin') {
    can('manage', 'all');

  } else if (user.role === 'professor') {
    can('read',   'Student');
    // Profesorul poate citi DOAR notele acordate de el
    can('read',   'Grade',  { professorId: user.id });
    can('create', 'Grade',  { professorId: user.id });
    can('update', 'Grade',  { professorId: user.id });
    cannot('delete', 'Grade');
    cannot('read',   'AuditLog');
    cannot('manage', 'User');

  } else if (user.role === 'student') {
    // Studentul poate citi DOAR datele proprii
    can('read', 'Grade',   { studentId: user.id });
    can('read', 'Student', { userId:    user.id });
    cannot('create', 'Grade');
    cannot('update', 'Grade');
    cannot('delete', 'Grade');
    cannot('read',   'AuditLog');
    cannot('manage', 'User');
  }

  return build();
}

module.exports = defineAbilityFor;
