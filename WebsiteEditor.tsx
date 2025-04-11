                    <div 
                      className="h-[300px] rounded-lg overflow-hidden mb-6 flex items-center justify-center"
                      style={{ backgroundColor: getColorById(formData.theme?.primaryColor || 'blue').value }}
                    >
                      <h1 className="text-4xl font-bold text-white text-center px-6">
                        {formData.clubName || 'Your Club Name'}
                      </h1>
                    </div>
                      <label className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer">
                        <ArrowUpTrayIcon className="h-4 w-4 mr-1 text-white" />
                        Upload PDF
                      <button
                        onClick={handleAddLinkResource}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                      >
                        <GlobeAltIcon className="h-4 w-4 mr-1 text-white" />
                        Add Link
                      <button
                        onClick={handleAddMember}
                        className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                      >
                        <PlusIcon className="h-4 w-4 mr-1 text-white" />
                        Add Member
                          <button
                            onClick={handleAddMember}
                            className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            <PlusIcon className="h-4 w-4 mr-1 text-white" />
                            Add Your First Team Member
                      <button
                        onClick={handleAddContactLink}
                        className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                      >
                        <PlusIcon className="h-4 w-4 mr-1 text-white" />
                        Add Contact Link
                          <button
                            onClick={handleAddContactLink}
                            className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            <PlusIcon className="h-4 w-4 mr-1 text-white" />
                            Add Your First Contact Link
                      <label className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer">
                        <ArrowUpTrayIcon className="h-4 w-4 mr-1 text-white" />
                        Upload Your First PDF 
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#4361EE] to-[#3A54D4] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    <span className="text-white">Saving...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white">Save All</span>
                  </>
                )}
              </button>
              <button
                onClick={handleViewSite}
                className="w-full bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md"
              >
                <span className="text-white">Open Published Site</span>
              </button>
                <button
                  onClick={() => toggleActivityType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activityTypes.includes(type)
                      ? 'bg-[#38BFA1] text-white shadow-md'
                      : 'bg-blue-50 text-black hover:bg-blue-100'
                  }`}
                >
                  {type}
                </button>
                <button
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-[#38BFA1] text-white shadow-md'
                      : 'bg-blue-50 text-black hover:bg-blue-100'
                  }`}
                >
                  {cat}
                </button> 