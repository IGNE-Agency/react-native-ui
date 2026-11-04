Pod::Spec.new do |s|
  s.name           = 'FieldAccessibility'
  s.version        = '1.0.0'
  s.summary        = 'Field accessibility state for React Native controls.'
  s.description    = 'Attaches re-readable custom content to a field control accessibility element.'
  s.license        = { :type => 'MIT' }
  s.author         = 'IGNE'
  s.homepage       = 'https://github.com/IGNE-Agency/react-native-ui'
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/IGNE-Agency/react-native-ui.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'Accessibility'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
