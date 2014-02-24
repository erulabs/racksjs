asset = require 'assert'
path = require 'path'
fs = require 'fs'
RacksJS = require '../lib/racks.js'

describe "RacksJS", ->
  it "should authenticate", (ok) ->
    new RacksJS {
      username: process.env.USERNAME,
      apiKey: process.env.APIKEY,
      verbosity: 1
    }, (rs) ->
      ok()
      describe "HTTP verbs", ->
        it "should work without error! (HTTP calls mocked)", (ok) ->
          rs.test = on
          rs.get 'http://github.com/erulabs/racksjs', (reply) ->
            rs.post 'http://github.com/erulabs/racksjs', {}, (reply) ->
              rs.delete 'http://github.com/erulabs/racksjs', (reply) ->
                rs.put 'http://github.com/erulabs/racksjs', (reply) ->
                  ok()
                  rs.test = off
                  describe "Service catalog", ->
                    it "parsing should have occured (even against our mock catalog)", (ok) ->
                      for product in rs.serviceCatalog
                        if !rs.products[product.name]? then return ok(throw new Error('Error parsing catalog!'))
                      ok()

                      describe "NextGen Flavors", ->
                        it "can retrieve a list of flavors", (ok) ->
                          rs.cloudServersOpenStack.flavors.all (reply) ->
                            ok()
                            # Flavor specific testing

                      describe "NextGen Images", ->
                        it "can retrieve a list of images", (ok) ->
                          rs.cloudServersOpenStack.images.all (reply) ->
                            ok()
                            # Image specific testing
                      
                      describe "NextGen Servers", ->
                        it ".new() should create a new server", (ok) ->
                          rs.cloudServersOpenStack.servers.new {
                            name: 'racksjs-testBuild-01'
                            imageRef: '1eb491c1-c5fb-4b34-be53-196a0c0588ba'
                            flavorRef: 'performance1-1'
                          }, (server) ->
                            ok()
                            describe "NextGen Servers", ->
                              it "should eventually build and return a working racksjs model", (ok) ->
                                checkFunc = () ->
                                  server.details (details) ->
                                    if details.status is 'ACTIVE'
                                      ok()
                                      clearInterval check
                                      describe "NextGen Servers", ->
                                        it "should delete without issue", (ok) ->
                                          server.delete (reply) ->
                                            ok()
                                check = setInterval checkFunc, 10000