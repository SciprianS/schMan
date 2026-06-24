const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(user) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === 'admin') {
    // Adminul poate face orice
    can('manage', 'all');

  } else if (user.role === 'professor') {
    can('read',   'Student');
    can('read',   'Grade');
    // Poate crea/modifica note DOAR cu propriul ID
    can('create', 'Grade', { professorId: user.id });
    can('update', 'Grade', { professorId: user.id });
    // Interzis explicit
    cannot('delete', 'Grade');
    cannot('read',   'AuditLog');
    cannot('manage', 'User');

  } else if (user.role === 'student') {
    // Poate citi DOAR propriile date
    can('read', 'Grade',   { studentId: user.id });
    can('read', 'Student', { userId:    user.id });
    // Interzis orice operatiune de scriere
    cannot('create', 'Grade');
    cannot('update', 'Grade');
    cannot('delete', 'Grade');
    cannot('read',   'AuditLog');
    cannot('manage', 'User');
  }

  return build();
}

module.exports = defineAbilityFor;
