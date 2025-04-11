const formatMeetingInfo = (website: ClubSite) => {
  if (!website.meetingInfo) return null;

  const { days, room, jamboreeTable } = website.meetingInfo;
  const meetingDays = days?.map(d => d.day).join(', ') || '';

  return (
    <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
      <div className="space-y-2">
        {room && (
          <div>
            <span className="font-medium">Room:</span> {room}
          </div>
        )}
        {jamboreeTable && (
          <div>
            <span className="font-medium">Table:</span> {jamboreeTable}
          </div>
        )}
        {days && days.length > 0 && (
          <div>
            <span className="font-medium">Meetings:</span> {meetingDays}
          </div>
        )}
      </div>
    </div>
  );
};

<div className="p-5 flex-grow flex flex-col justify-between">
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {website.clubName}
    </h3>
    <p className="text-gray-600 mb-2 line-clamp-2">
      {website.slogan || website.description?.substring(0, 100) || 'No description available.'}
    </p>
    {website.members?.find(m => m.role.toLowerCase().includes('captain')) && (
      <p className="text-sm text-gray-500 mb-2">
        Captain: {website.members.find(m => m.role.toLowerCase().includes('captain'))?.name}
      </p>
    )}
    {website.meetingInfo && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          {website.meetingInfo.room && (
            <span className="font-medium">Room {website.meetingInfo.room}</span>
          )}
          {website.meetingInfo.jamboreeTable && (
            <span className="font-medium">Table {website.meetingInfo.jamboreeTable}</span>
          )}
        </div>
        <div className="flex justify-between">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
            const isActiveDay = website.meetingInfo?.days?.some(
              d => d.day.toLowerCase().startsWith(day.toLowerCase())
            );
            return (
              <div
                key={day}
                className={`flex items-center justify-center w-10 h-10 rounded-lg text-xs font-medium ${
                  isActiveDay
                    ? 'bg-[#38BFA1]/10 border-2 border-[#38BFA1] text-[#38BFA1]'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
  <div className="flex justify-between items-center mt-4">
    <span className="text-sm text-gray-500">
      Updated {new Date(website.updatedAt).toLocaleDateString()}
    </span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/${website.slug}`);
      }}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#38BFA1] hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38BFA1]"
    >
      Visit Site
    </button>
  </div>
</div> 