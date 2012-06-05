from flaskext.login import UserMixin
from flask.ext.sqlalchemy import SQLAlchemy

from UserDict import DictMixin
import time
import os

db = SQLAlchemy()

class Base(object):

	id = db.Column(db.Integer, primary_key=True)
	
	@classmethod
	def get_by_id(_class, id):
		return _class.query.filter_by(id = id).first()
	
	@classmethod
	def update_by_id(_class, id, args):
		o = _class.get_by_id(id)
		if o:
			o.init(args)
			db.session.commit()
	
	@classmethod
	def delete_by_id(_class, id):
		o = _class.get_by_id(id)
		if o:
			db.session.delete(o)
			db.session.commit()
	
	def init(self, args):
		columns = [c.name for c in self.__table__.columns]
		for k, v in args.items():
			if k in columns:
				self.__setattr__(k, v)
	
	def to_dict(self):
		d = {}
		columns = [c.name for c in self.__table__.columns]
		for k in columns:
			d[k] = self.__dict__[k]
		return d

class User(db.Model, Base, UserMixin):
	__tablename__ = "users"
	
	username = db.Column(db.String)
	token = db.Column(db.String)
	collaborators = db.relationship("Collaborator", order_by="Collaborator.id", \
			backref="user", cascade="all, delete, delete-orphan")
	
	def __init__(self, username, token):
		self.init(locals())
	
	def is_active(self):
		return True
	
	def get_auth_token(self):
		return self.token
	
	@staticmethod
	def get_by_username(username):
		return db.session.query(User).filter(User.username == username).first()
	
	@staticmethod
	def get_by_token(token):
		return db.session.query(User).filter(User.token == token).first()
	
	@staticmethod
	def add_user(username, token):
		new_user = User(username, token)
		db.session.add(new_user)
		db.session.commit()
		
		return new_user
		

class Trip(db.Model, Base):
	__tablename__ = "trips"
	name = db.Column(db.String)
	timestamp = db.Column(db.Integer)
	
	collaborators = db.relationship("Collaborator", order_by="Collaborator.id", \
			backref="trip", cascade="all, delete, delete-orphan")
	event_types = db.relationship("EventType", order_by="EventType.id", \
			backref="trip", cascade="all, delete, delete-orphan")
	events = db.relationship("Event", order_by="Event.start_time", \
			backref="trip", cascade="all, delete, delete-orphan")
	logs = db.relationship("Log", order_by="Log.id", \
			backref="trip", cascade="all, delete, delete-orphan")
	
	def __init__(self, name):
		self.init(locals())
	
	@staticmethod
	def add_trip(name, user_id):
		new_trip = Trip(name)
		db.session.add(new_trip)
		db.session.flush()
		
		# add owner
		new_co = Collaborator(new_trip.id, user_id, 4)
		db.session.add(new_co)
		
		db.session.commit()
		
		return new_trip
	
	def get_logs(self):
		reversed_logs = self.logs[-5:]
		reversed_logs.reverse()
		return [l.to_dict() for l in reversed_logs]
	
	def to_dict(self):
		d = Base.to_dict(self)
		d["owner_name"] = self.collaborators[0].user.username
		
		if (self.events):
			d["start_time"] = self.events[0].start_time * 60 * 1000
			d["end_time"] = self.events[-1].end_time * 60 * 1000
		
		return d
	
	@staticmethod
	def get_all_trips():
		return [dict({"permission": 1}, **(i.to_dict())) for i in db.session.query(Trip)]
		

class Collaborator(db.Model, Base):
	__tablename__ = "collaborators"
	
	trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"))
	user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
	permission = db.Column(db.Integer, nullable=False)

	created_events = db.relationship("Event", order_by="Event.id", \
		backref="creator", cascade="all, delete, delete-orphan")
	logs = db.relationship("Log", order_by="Log.id", \
		backref="collaborator", cascade="all, delete, delete-orphan")
	
	db.UniqueConstraint("trip_id", "user_id")
	
	def __init__(self, trip_id, user_id, permission):
		self.init(locals())
	
	@staticmethod
	def add_collaborator(trip_id, user_id, permission):
		if (permission > 0) and (permission < 4):
			new_co = Collaborator(trip_id, user_id, permission)
			db.session.add(new_co)
			db.session.commit()
			
			return new_co
		
		return None
	
	@staticmethod
	def get_collaborator(trip_id, user_id):
		return db.session.query(Collaborator).\
				filter(Collaborator.user_id == user_id).\
				filter(Collaborator.trip_id == trip_id).first()
	
	@staticmethod
	def update_collaborator(co_id, permission):
		if (permission > 0) and (permission < 4):
			Collaborator.update_by_id(co_id, locals())
		
	@staticmethod
	def delete_by_id(co_id):
		co = Collaborator.get_by_id(co_id)
		if co:
			co.permission = 0
			db.session.commit()
	
	def to_dict(self):
		d = Base.to_dict(self)
		d["username"] = self.user.username
		
		return d
		

class EventType(db.Model, Base):
	__tablename__ = "event_types"
	
	name = db.Column(db.String)
	trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"))
	
	events = db.relationship("Event", order_by="Event.id", \
		backref="event_type", cascade="all, delete, delete-orphan")
	
	def __init__(self, name, trip_id):
		self.init(locals())
	
	@staticmethod
	def add_event_type(name, trip_id):
		event_type = EventType(name, trip_id)
		db.session.add(event_type)
		db.session.commit()
		
		return event_type
	
	@staticmethod
	def update_event_type(event_type_id, name):
		EventType.update_by_id(event_type_id, locals())

class Event(db.Model, Base):
	__tablename__ = "events"
	
	name = db.Column(db.String)
	type_id = db.Column(db.Integer, db.ForeignKey("event_types.id"))
	trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"))
	creator_id = db.Column(db.Integer, db.ForeignKey("collaborators.id"))
	start_time = db.Column(db.Integer)
	end_time = db.Column(db.Integer)
	suggested_interval = db.Column(db.Integer)
	is_arranged = db.Column(db.Integer)
	
	locations = db.relationship("Location", order_by="Location.order_index", \
		backref="event", cascade="all, delete, delete-orphan")
	
	def __init__(self, name, type_id, trip_id, creator_id, start_time, end_time, suggested_interval, is_arranged):
		self.init(locals())
	
	def to_dict(self):
		d = Base.to_dict(self)
		d["start_time"] = d["start_time"] * 60 * 1000
		d["end_time"] = d["end_time"] * 60 * 1000
		
		d["creator_name"] = self.creator.user.username
		
		loc_list = []
		for loc in self.locations:
			loc_list.append(loc.to_tuple())
		d["location_names"] = [loc[0] for loc in loc_list]
		d["location_lats"] = [loc[1] for loc in loc_list]
		d["location_lngs"] = [loc[2] for loc in loc_list]
		
		return d
	
	@staticmethod
	def add_event(name, type_id, trip_id, creator_id, start_time, end_time, suggested_interval, is_arranged, locations):
		new_event = Event(name, type_id, trip_id, creator_id, int(start_time) / 60 / 1000, int(end_time) / 60 / 1000, suggested_interval, is_arranged)
		db.session.add(new_event)
		db.session.flush()
		
		# add locations
		count = 1
		for loc in locations:
			new_loc = Location(loc[0], new_event.id, loc[1], loc[2], count)
			db.session.add(new_loc)
			count += 1
		
		# add to log
		log = Log(trip_id, creator_id, new_event.name, 1)
		db.session.add(log)
		
		db.session.commit()
	
	@staticmethod
	def update_event(modifier_id, event_id, name, type_id, start_time, end_time, suggested_interval, is_arranged, locations):
		event = Event.get_by_id(event_id)
		event.__init__(name, type_id, event.trip_id, event.creator_id, int(start_time) / 60 / 1000, int(end_time) / 60 / 1000, suggested_interval, is_arranged)
		
		# delete old locations
		for loc in event.locations:
			db.session.delete(loc)
		
		# add new locations
		count = 1
		for loc in locations:
			new_loc = Location(loc[0], event.id, loc[1], loc[2], count)
			db.session.add(new_loc)
			count += 1
		
		# add to log
		log = Log(event.trip_id, modifier_id, event.name, 2)
		db.session.add(log)
		
		db.session.commit()
	
	@staticmethod
	def update_time(modifier_id, event_ids, start_times, end_times):
		requests = zip(event_ids, start_times, end_times)
		for r in requests:
			event = Event.get_by_id(r[0])
			event.start_time = int(r[1]) / 60 / 1000
			event.end_time = int(r[2]) / 60 / 1000
		
		log = Log(event.trip_id, modifier_id, None, 3)
		db.session.add(log)
		
		db.session.commit()
	
	@staticmethod
	def delete_by_id(modifier_id, id):
		event = Event.get_by_id(id)
		if event:
			log = Log(event.trip_id, modifier_id, event.name, 4)
			db.session.delete(event)
			db.session.add(log)	
			db.session.commit()
		

class Location(db.Model, Base):
	__tablename__ = "locations"
	
	name = db.Column(db.String)
	event_id = db.Column(db.Integer, db.ForeignKey("events.id"))
	lat = db.Column(db.Float)
	lng = db.Column(db.Float)
	order_index = db.Column(db.Integer)
	
	db.UniqueConstraint("event_id", "order_index")

	def __init__(self, name, event_id, lat, lng, order_index):
		self.init(locals())
	
	def to_tuple(self):
		return (self.name, self.lat, self.lng)

class Log(db.Model, Base):
	__tablename__ = "logs"
	trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"))
	collaborator_id = db.Column(db.Integer, db.ForeignKey("collaborators.id"))
	event_name = db.Column(db.String)
	type = db.Column(db.Integer)
	
	def __init__(self, trip_id, collaborator_id, event_name, type):
		self.init(locals())
	
	def to_dict(self):
		return {"username": self.collaborator.user.username,
			"event": self.event_name,
			"type": self.type}
	