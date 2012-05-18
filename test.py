# 
# Automatic testing on Server-side model objects
#
from model import *
from flask import Flask
app = Flask(__name__)
SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(os.path.dirname(__file__), "UnitTest", "unittest.db")

app.config.from_object(__name__)
db.init_app(app)
app.test_request_context().push()
db.create_all()

def test(testName, data, expected):
	print testName
	assert(data == expected)
	print '...Passed'
		
#
# Test User
#
print ('Test User Module\n')
user1 = User.add_user('abc', 456)
test('test get user by username', User.get_by_username('abc').token, '456')
test('test get user by token', User.get_by_token('456').username, 'abc')
test('test get user by name not existing user', User.get_by_username('a'), None)
test('test get user by token not existing user', User.get_by_token('123'), None)

#
# Test trip
#
print ('\n\nTest Trip Module\n')
newTrip = Trip.add_trip('trip1', user1.id)
test('test empty trip log', newTrip.get_logs(), [])

#
# Test Collaborator
#
print ('\n\nTest Collaborator Module\n')
user2 = User.add_user('def', 789)
test('test invalid permission 0', Collaborator.add_collaborator(newTrip.id, user2.id, 0), None)
test('test invalid permission 4', Collaborator.add_collaborator(newTrip.id, user2.id, 4), None)

col2 = Collaborator.add_collaborator(newTrip.id, user2.id, 2)
test('test get collaborator', Collaborator.get_collaborator(newTrip.id, user2.id), col2)

Collaborator.update_collaborator(col2.id, 3)
test('test update collaborator', col2.permission, 3)

# Invalid new permission
Collaborator.update_collaborator(col2.id, 4)
test('test invalid update collaborator', col2.permission, 3)

# Delete sets new permission to 0
Collaborator.delete_by_id(col2.id)
test('test delete collaborator', col2.permission, 0)

#
# Test EventType
#
print ('\n\n Test EventType Module\n')
et1 = EventType.add_event_type('xyz', newTrip.id)
test('test add event type', et1.name, 'xyz')


#
# Test Event
#
print ('\n\n Test EventType Module\n')
Event.add_event('event1', et1.id, newTrip.id, \
		Collaborator.get_collaborator(newTrip.id, user1.id).id, \
		120000, 240000, 10, 0, [('loc', 3, 4)])
event = Event.get_by_id(1)
test('test add event', event.name, 'event1')

#
# Test Location
#
print ('\n\n Test Location Module\n')
loc = Location('loc', event.id, 1.2, 3.4, 0)
test('test add location', loc.name, 'loc')
test('test location to tuple', loc.to_tuple(), ('loc', 1.2, 3.4))