            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <BuildingLibraryIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="font-medium text-black">Jamboree Table:</span> {jamboreeTable}
              </div>
            </div>
            
            {/* Meeting Times */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <ClockIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="font-medium text-black">Meetings:</span> {meetingFrequency} on {meetingDays}
              </div>
            </div>
            
            {/* Room */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <BuildingLibraryIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="font-medium text-black">Room:</span> {meetingRoom}
              </div>
            </div>
            
            {/* Captains */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <UserIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="font-medium text-black">Captains:</span> {captainNames || 'TBD'}
              </div>
            </div>
            
            {/* Sponsor */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <UserIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="font-medium text-black">Sponsor:</span> {sponsorName}
              </div>
            </div>
            
            {/* Sponsor Email */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <AtSymbolIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div className="break-all">
                <span className="font-medium text-black">@ Sponsor:</span> {sponsorEmail}
              </div>
            </div>
            
            {/* Captain Email */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <AtSymbolIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div className="break-all">
                <span className="font-medium text-black">@ Captain:</span> {captainEmail}
              </div>
            </div> 